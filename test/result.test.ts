import { describe, it, expect, vi } from "vitest";
import { ok, err, isResult, Ok, Err, type Result } from "../src/index.js";

describe("ok / err construction", () => {
  it("builds Ok with a value and the right discriminant", () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    expect(r.isOk()).toBe(true);
    expect(r.isErr()).toBe(false);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("builds Err with an error and the right discriminant", () => {
    const r = err("boom");
    expect(r.ok).toBe(false);
    expect(r.isErr()).toBe(true);
    expect(r.isOk()).toBe(false);
    if (!r.ok) expect(r.error).toBe("boom");
  });

  it("isResult recognizes both branches and rejects others", () => {
    expect(isResult(ok(1))).toBe(true);
    expect(isResult(err(1))).toBe(true);
    expect(isResult({ ok: true, value: 1 })).toBe(false);
    expect(isResult(null)).toBe(false);
  });
});

describe("map / mapErr", () => {
  it("map transforms Ok, leaves Err", () => {
    expect(ok(2).map((x) => x * 10).unwrap()).toBe(20);
    const e = err<string, number>("bad").map((x) => x * 10);
    expect(e.unwrapErr()).toBe("bad");
  });

  it("mapErr transforms Err, leaves Ok", () => {
    expect(err("bad").mapErr((s) => s.toUpperCase()).unwrapErr()).toBe("BAD");
    expect(ok(5).mapErr(() => "x").unwrap()).toBe(5);
  });
});

describe("andThen / orElse", () => {
  const half = (n: number): Result<number, string> =>
    n % 2 === 0 ? ok(n / 2) : err("odd");

  it("andThen chains on Ok and short-circuits on Err", () => {
    expect(ok(8).andThen(half).andThen(half).unwrap()).toBe(2);
    expect(ok(3).andThen(half).unwrapErr()).toBe("odd");
    expect(err<string, number>("first").andThen(half).unwrapErr()).toBe("first");
  });

  it("orElse recovers from Err", () => {
    expect(err<string, number>("x").orElse(() => ok(99)).unwrap()).toBe(99);
    expect(ok(1).orElse(() => ok(99)).unwrap()).toBe(1);
  });
});

describe("unwrap family", () => {
  it("unwrap returns value or throws the underlying Error", () => {
    expect(ok(7).unwrap()).toBe(7);
    const boom = new Error("kaboom");
    expect(() => err(boom).unwrap()).toThrow(boom);
  });

  it("unwrap on a non-Error Err throws a TypeError", () => {
    expect(() => err("nope").unwrap()).toThrow(TypeError);
  });

  it("unwrapErr returns the error or throws on Ok", () => {
    expect(err("e").unwrapErr()).toBe("e");
    expect(() => ok(1).unwrapErr()).toThrow(TypeError);
  });

  it("unwrapOr / unwrapOrElse fall back only on Err", () => {
    expect(ok(1).unwrapOr(0)).toBe(1);
    expect(err<string, number>("e").unwrapOr(0)).toBe(0);
    expect(err<string, number>("e").unwrapOrElse((s) => s.length)).toBe(1);
    expect(ok(5).unwrapOrElse(() => 0)).toBe(5);
  });
});

describe("match / tap", () => {
  it("match folds both branches", () => {
    const fold = (r: Result<number, string>) =>
      r.match({ ok: (v) => `ok:${v}`, err: (e) => `err:${e}` });
    expect(fold(ok(1))).toBe("ok:1");
    expect(fold(err("z"))).toBe("err:z");
  });

  it("tap / tapErr run only on the matching branch and return this", () => {
    const onOk = vi.fn();
    const onErr = vi.fn();
    const r = ok(3);
    expect(r.tap(onOk).tapErr(onErr)).toBe(r);
    expect(onOk).toHaveBeenCalledWith(3);
    expect(onErr).not.toHaveBeenCalled();

    const e = err("x");
    e.tap(onOk).tapErr(onErr);
    expect(onErr).toHaveBeenCalledWith("x");
  });
});

describe("toOption", () => {
  it("Ok -> Some, Err -> None", () => {
    expect(ok(1).toOption().isSome()).toBe(true);
    expect(err("x").toOption().isNone()).toBe(true);
  });
});

describe("classes are exported", () => {
  it("instances are of Ok / Err", () => {
    expect(ok(1)).toBeInstanceOf(Ok);
    expect(err(1)).toBeInstanceOf(Err);
  });
});
