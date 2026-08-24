/**
 * One-off migration for the phone-normalization change.
 *
 * customers.phoneNumber is the unique identity key and the basis of the
 * checkout ban check, but historical rows hold whatever the customer typed —
 * so "+20 123 456 7890" and "+201234567890" are two rows for one person.
 * Normalizing in place can therefore collide on the unique index.
 *
 * Runs as a DRY RUN by default and reports what it would do. Pass --apply to
 * write. Merges are conservative: the oldest row wins, its blank fields are
 * filled from the duplicates, orders are repointed, and a customer is left
 * banned if ANY of the merged rows was banned.
 *
 * Run: npx tsx scripts/normalize-customer-phones.ts [--apply]
 */
import { config } from "dotenv";
import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../src/db";
import { customers, orders } from "../src/db/schema";
import { normalizePhoneNumber } from "../src/utils/normalize-phone";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getDb();
  const rows = await db
    .select()
    .from(customers)
    .orderBy(asc(customers.createdAt), asc(customers.id));

  // Group every existing row by what its phone number normalizes to
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = normalizePhoneNumber(row.phoneNumber);
    if (!key) {
      console.warn(`! customer ${row.id} has an unusable phone ${JSON.stringify(row.phoneNumber)} — skipped`);
      continue;
    }
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  let rewrites = 0;
  let merges = 0;

  for (const [canonical, bucket] of groups) {
    const [survivor, ...duplicates] = bucket;

    if (duplicates.length > 0) {
      merges += 1;
      console.log(
        `MERGE ${canonical}: keeping ${survivor.id} (${survivor.createdAt.toISOString().slice(0, 10)}), ` +
          `absorbing ${duplicates.map((row) => row.id).join(", ")}`,
      );

      if (APPLY) {
        const duplicateIds = duplicates.map((row) => row.id);
        await db
          .update(orders)
          .set({ customerId: survivor.id })
          .where(inArray(orders.customerId, duplicateIds));

        await db
          .update(customers)
          .set({
            phoneNumber: canonical,
            // Fill blanks from the duplicates; never overwrite a set value
            email: survivor.email ?? duplicates.find((row) => row.email)?.email ?? null,
            city: survivor.city ?? duplicates.find((row) => row.city)?.city ?? null,
            userId: survivor.userId ?? duplicates.find((row) => row.userId)?.userId ?? null,
            // A ban must survive a merge, or merging silently unbans someone
            isBanned: bucket.some((row) => row.isBanned),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, survivor.id));

        await db.delete(customers).where(inArray(customers.id, duplicateIds));
      }
      continue;
    }

    if (survivor.phoneNumber !== canonical) {
      rewrites += 1;
      console.log(`REWRITE ${survivor.id}: ${survivor.phoneNumber} -> ${canonical}`);
      if (APPLY) {
        await db
          .update(customers)
          .set({ phoneNumber: canonical, updatedAt: new Date() })
          .where(eq(customers.id, survivor.id));
      }
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "DRY RUN"} — ${rewrites} rewrite(s), ${merges} merge(s) across ${rows.length} customer row(s).`,
  );
  if (!APPLY) console.log("Re-run with --apply to write these changes.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
