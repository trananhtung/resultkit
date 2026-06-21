import { describe, it, expect } from "vitest";
import { all, any, partition, ok, err, type Result } from "../src/index.js";

describe("all", () => {
  it("collects values when every Result is Ok", () => {
    const r = all([ok(1), ok("two"), ok(true)]);
    expect(r.ok).toBe(true);
    expect(r.unwrap()).toEqual([1, "two", true]);
  });

  it("short-circuits on the first Err", () => {
    const r = all([ok(1), err("first"), err("second")]);
    expect(r.ok).toBe(false);
    expect(r.unwrapErr()).toBe("first");
  });

  it("handles an empty list as Ok([])", () => {
    expect(all([]).unwrap()).toEqual([]);
  });

  it("preserves tuple types", () => {
    const r = all([ok(1), ok("x")] as const);
    if (r.ok) {
      const [n, s]: [number, string] = r.value;
      expect(n).toBe(1);
      expect(s).toBe("x");
    }
  });
});

describe("any", () => {
  it("returns the first Ok", () => {
    const r = any([err("a"), ok(2), err("c")]);
    expect(r.unwrap()).toBe(2);
  });

  it("collects all errors when everything fails", () => {
    const r = any([err("a"), err("b")]);
    expect(r.ok).toBe(false);
    expect(r.unwrapErr()).toEqual(["a", "b"]);
  });
});

describe("partition", () => {
  it("splits oks and errs preserving order", () => {
    const results: Result<number, string>[] = [
      ok(1),
      err("x"),
      ok(2),
      err("y"),
      ok(3),
    ];
    const { oks, errs } = partition(results);
    expect(oks).toEqual([1, 2, 3]);
    expect(errs).toEqual(["x", "y"]);
  });

  it("handles empties", () => {
    expect(partition([])).toEqual({ oks: [], errs: [] });
  });
});
