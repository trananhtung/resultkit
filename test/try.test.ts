import { describe, it, expect } from "vitest";
import { tryCatch, tryCatchAsync, fromThrowable } from "../src/index.js";

describe("tryCatch", () => {
  it("captures a return value as Ok", () => {
    const r = tryCatch(() => JSON.parse('{"a":1}'));
    expect(r.ok).toBe(true);
    expect(r.unwrap()).toEqual({ a: 1 });
  });

  it("captures a throw as Err(Error)", () => {
    const r = tryCatch(() => JSON.parse("not json"));
    expect(r.ok).toBe(false);
    expect(r.unwrapErr()).toBeInstanceOf(Error);
  });

  it("coerces non-Error throws into Error", () => {
    const r = tryCatch(() => {
      throw "string failure";
    });
    expect(r.unwrapErr()).toBeInstanceOf(Error);
    expect(r.unwrapErr().message).toBe("string failure");
  });

  it("applies mapErr to the caught value", () => {
    const r = tryCatch(
      () => {
        throw new Error("low");
      },
      (e) => ({ code: 500, cause: e }),
    );
    expect(r.unwrapErr().code).toBe(500);
  });
});

describe("tryCatchAsync", () => {
  it("accepts a promise and resolves to Ok", async () => {
    const r = await tryCatchAsync(Promise.resolve(7));
    expect(r.unwrap()).toBe(7);
  });

  it("accepts a thunk and captures rejection as Err", async () => {
    const r = await tryCatchAsync(() => Promise.reject(new Error("net")));
    expect(r.ok).toBe(false);
    expect(r.unwrapErr().message).toBe("net");
  });

  it("captures a synchronous throw inside the thunk", async () => {
    const r = await tryCatchAsync(() => {
      throw new Error("sync");
    });
    expect(r.unwrapErr().message).toBe("sync");
  });

  it("applies mapErr", async () => {
    const r = await tryCatchAsync(
      () => Promise.reject("oops"),
      (e) => `wrapped:${String(e)}`,
    );
    expect(r.unwrapErr()).toBe("wrapped:oops");
  });
});

describe("fromThrowable", () => {
  it("wraps a throwing function preserving arguments", () => {
    const safeParse = fromThrowable(JSON.parse);
    expect(safeParse("[1,2]").unwrap()).toEqual([1, 2]);
    expect(safeParse("xx").ok).toBe(false);
  });

  it("supports mapErr", () => {
    const div = fromThrowable(
      (a: number, b: number) => {
        if (b === 0) throw new Error("div0");
        return a / b;
      },
      () => "DIVISION_ERROR" as const,
    );
    expect(div(10, 2).unwrap()).toBe(5);
    expect(div(1, 0).unwrapErr()).toBe("DIVISION_ERROR");
  });
});
