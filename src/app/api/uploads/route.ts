import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/better-auth";
import { ADMIN_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types/shared";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

type ImageExtension = "jpg" | "png" | "webp" | "avif";

/**
 * Magic-byte detection. `file.type` is the client-supplied multipart header —
 * trivially spoofed — so it can decide neither whether the upload is an image
 * nor what extension it is stored under.
 */
function detectImageType(bytes: Uint8Array): ImageExtension | null {
  const startsWith = (offset: number, signature: number[]) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith(0, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // RIFF....WEBP
  if (startsWith(0, [0x52, 0x49, 0x46, 0x46]) && startsWith(8, [0x57, 0x45, 0x42, 0x50])) {
    return "webp";
  }
  // ....ftypavif — the brand sits at byte 8 of the ISO-BMFF box
  if (startsWith(4, [0x66, 0x74, 0x79, 0x70]) && startsWith(8, [0x61, 0x76, 0x69, 0x66])) {
    return "avif";
  }
  return null;
}

/**
 * PROTOTYPE: local-disk storage under public/uploads. Works in dev and on
 * single-node hosts; replace with object storage for serverless deploys.
 */
export async function POST(request: Request): Promise<Response> {
  // Nothing else gates this route — proxy.ts only matches /admin/:path*, so
  // without this check any anonymous request writes files to our own origin
  const session = await getAuth().api.getSession({ headers: request.headers });
  const role = session?.user?.role as UserRole | undefined;
  if (!role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cheap first gate before formData() buffers the whole body into memory
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image exceeds 5MB" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Image exceeds 5MB" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = detectImageType(bytes);
  if (!extension) {
    return NextResponse.json({ error: "Unsupported image format" }, { status: 415 });
  }

  const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), bytes);

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
