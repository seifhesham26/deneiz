import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

const HOUR = 60 * 60 * 1000;
const QUARTER_HOUR = 15 * 60 * 1000;

afterEach(() => vi.useRealTimers());

describe("checkRateLimit", () => {
  it("allows up to the limit then refuses", () => {
    const key = `t-${Math.random()}`;
    expect(checkRateLimit(key, 2, HOUR).allowed).toBe(true);
    expect(checkRateLimit(key, 2, HOUR).allowed).toBe(true);
    expect(checkRateLimit(key, 2, HOUR).allowed).toBe(false);
  });

  it("starts a fresh window once the old one expires", () => {
    vi.useFakeTimers();
    const key = `t-${Math.random()}`;
    expect(checkRateLimit(key, 1, QUARTER_HOUR).allowed).toBe(true);
    expect(checkRateLimit(key, 1, QUARTER_HOUR).allowed).toBe(false);
    vi.advanceTimersByTime(QUARTER_HOUR + 1);
    expect(checkRateLimit(key, 1, QUARTER_HOUR).allowed).toBe(true);
  });

  it("does not let a short-window caller expire a long-window bucket", () => {
    // The sweep used to judge every bucket by the calling site's window, so a
    // 15-minute lookup could clear an hour-long review bucket at 20 minutes.
    vi.useFakeTimers();
    const longKey = `review-${Math.random()}`;
    expect(checkRateLimit(longKey, 1, HOUR).allowed).toBe(true);

    vi.advanceTimersByTime(20 * 60 * 1000);
    checkRateLimit(`lookup-${Math.random()}`, 1, QUARTER_HOUR);

    expect(checkRateLimit(longKey, 1, HOUR).allowed).toBe(false);
  });
});
