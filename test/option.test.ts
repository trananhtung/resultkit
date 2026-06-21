import { describe, it, expect, vi } from "vitest";
import {
  some,
  none,
  fromNullable,
  isOption,
  Some,
  None,
  type Option,
} from "../src/index.js";

describe("some / none construction", () => {
  it("some carries a value", () => {
    const o = some(5);
    expect(o.some).toBe(true);
    expect(o.isSome()).toBe(true);
    expect(o.isNone()).toBe(false);
    if (o.some) expect(o.value).toBe(5);
  });

  it("none is absent and is a shared singleton", () => {
    expect(none.some).toBe(false);
    expect(none.isNone()).toBe(true);
    expect(some(1).map(() => null as never)).not.toBe(none);
    expect(none).toBeInstanceOf(None);
    expect(some(1)).toBeInstanceOf(Some);
  });

  it("isOption recognizes both branches", () => {
    expect(isOption(some(1))).toBe(true);
    expect(isOption(none)).toBe(true);
    expect(isOption({ some: true })).toBe(false);
    expect(isOption(undefined)).toBe(false);
  });
});

describe("fromNullable", () => {
  it("wraps non-null values as Some", () => {
    expect(fromNullable(0).isSome()).toBe(true);
    expect(fromNullable("").isSome()).toBe(true);
    expect(fromNullable(false).isSome()).toBe(true);
  });

  it("maps null and undefined to None", () => {
    expect(fromNullable(null).isNone()).toBe(true);
    expect(fromNullable(undefined).isNone()).toBe(true);
  });
});

describe("map / andThen / filter", () => {
  it("map transforms Some, leaves None", () => {
    expect(some(2).map((x) => x + 1).unwrap()).toBe(3);
    expect(none.map((x: number) => x + 1).isNone()).toBe(true);
  });

  it("andThen chains optional steps", () => {
    const nonEmpty = (s: string): Option<string> =>
      s.length > 0 ? some(s) : none;
    expect(some("hi").andThen(nonEmpty).unwrap()).toBe("hi");
    expect(some("").andThen(nonEmpty).isNone()).toBe(true);
  });

  it("filter keeps or drops based on predicate", () => {
    expect(some(4).filter((x) => x % 2 === 0).isSome()).toBe(true);
    expect(some(5).filter((x) => x % 2 === 0).isNone()).toBe(true);
    expect(none.filter(() => true).isNone()).toBe(true);
  });
});

describe("orElse / unwrap family", () => {
  it("orElse supplies an alternative on None", () => {
    expect(none.orElse(() => some(9)).unwrap()).toBe(9);
    expect(some(1).orElse(() => some(9)).unwrap()).toBe(1);
  });

  it("unwrap throws on None", () => {
    expect(some(1).unwrap()).toBe(1);
    expect(() => none.unwrap()).toThrow(TypeError);
  });

  it("unwrapOr / unwrapOrElse fall back on None", () => {
    expect(some(1).unwrapOr(0)).toBe(1);
    expect(none.unwrapOr(0)).toBe(0);
    expect(none.unwrapOrElse(() => 7)).toBe(7);
  });
});

describe("match / tap / okOr", () => {
  it("match folds both branches", () => {
    const fold = (o: Option<number>) =>
      o.match({ some: (v) => `s:${v}`, none: () => "n" });
    expect(fold(some(2))).toBe("s:2");
    expect(fold(none)).toBe("n");
  });

  it("tap runs only on Some", () => {
    const spy = vi.fn();
    some(3).tap(spy);
    none.tap(spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it("okOr / okOrElse convert to Result", () => {
    expect(some(1).okOr("e").unwrap()).toBe(1);
    expect(none.okOr("e").unwrapErr()).toBe("e");
    expect(none.okOrElse(() => "lazy").unwrapErr()).toBe("lazy");
  });
});
