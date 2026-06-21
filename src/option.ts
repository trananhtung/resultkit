import { type Result, ok, err } from "./result.js";

/**
 * An `Option<T>` is either a {@link Some}`<T>` holding a value, or {@link None}.
 * It models "a value that might be absent" without reaching for `null` /
 * `undefined`, and narrows on the `.some` discriminant.
 *
 * ```ts
 * const head = first(list);        // Option<number>
 * if (head.some) use(head.value);  // narrowed to Some
 * ```
 */
export type Option<T> = Some<T> | None<T>;

interface OptionMethods<T> {
  /** Narrows to {@link Some} when `true`. */
  isSome(): this is Some<T>;
  /** Narrows to {@link None} when `true`. */
  isNone(): this is None<T>;
  /** Map the contained value, leaving `None` untouched. */
  map<U>(fn: (value: T) => U): Option<U>;
  /** Chain an optional step (a.k.a. `flatMap`). */
  andThen<U>(fn: (value: T) => Option<U>): Option<U>;
  /** Keep the value only if `predicate` holds, else become `None`. */
  filter(predicate: (value: T) => boolean): Option<T>;
  /** Provide an alternative `Option` when this is `None`. */
  orElse<U>(fn: () => Option<U>): Option<T | U>;
  /** The value, or throw if `None`. */
  unwrap(): T;
  /** The value, or `fallback` if `None`. */
  unwrapOr<U>(fallback: U): T | U;
  /** The value, or `fn()` if `None`. */
  unwrapOrElse<U>(fn: () => U): T | U;
  /** Fold both branches into a single value. */
  match<A, B>(matchers: { some: (value: T) => A; none: () => B }): A | B;
  /** Run a side effect on the value; returns `this` for chaining. */
  tap(fn: (value: T) => void): Option<T>;
  /** `Ok(value)` for `Some`, `Err(error)` for `None`. */
  okOr<E>(error: E): Result<T, E>;
  /** `Ok(value)` for `Some`, `Err(fn())` for `None`. */
  okOrElse<E>(fn: () => E): Result<T, E>;
}

/** The present branch of an {@link Option}. Created via {@link some}. */
export class Some<T> implements OptionMethods<T> {
  readonly some = true as const;
  constructor(readonly value: T) {}

  isSome(): this is Some<T> {
    return true;
  }
  isNone(): this is None<T> {
    return false;
  }
  map<U>(fn: (value: T) => U): Option<U> {
    return new Some(fn(this.value));
  }
  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : none;
  }
  orElse<U>(_fn: () => Option<U>): Option<T | U> {
    return this;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr<U>(_fallback: U): T | U {
    return this.value;
  }
  unwrapOrElse<U>(_fn: () => U): T | U {
    return this.value;
  }
  match<A, B>(matchers: { some: (value: T) => A; none: () => B }): A | B {
    return matchers.some(this.value);
  }
  tap(fn: (value: T) => void): Option<T> {
    fn(this.value);
    return this;
  }
  okOr<E>(_error: E): Result<T, E> {
    return ok(this.value);
  }
  okOrElse<E>(_fn: () => E): Result<T, E> {
    return ok(this.value);
  }
}

/** The absent branch of an {@link Option}. The singleton is exported as {@link none}. */
export class None<T = never> implements OptionMethods<T> {
  readonly some = false as const;

  isSome(): this is Some<T> {
    return false;
  }
  isNone(): this is None<T> {
    return true;
  }
  map<U>(_fn: (value: T) => U): Option<U> {
    return none;
  }
  andThen<U>(_fn: (value: T) => Option<U>): Option<U> {
    return none;
  }
  filter(_predicate: (value: T) => boolean): Option<T> {
    return this;
  }
  orElse<U>(fn: () => Option<U>): Option<T | U> {
    return fn();
  }
  unwrap(): T {
    throw new TypeError("Called unwrap() on a None value");
  }
  unwrapOr<U>(fallback: U): T | U {
    return fallback;
  }
  unwrapOrElse<U>(fn: () => U): T | U {
    return fn();
  }
  match<A, B>(matchers: { some: (value: T) => A; none: () => B }): A | B {
    return matchers.none();
  }
  tap(_fn: (value: T) => void): Option<T> {
    return this;
  }
  okOr<E>(error: E): Result<T, E> {
    return err(error);
  }
  okOrElse<E>(fn: () => E): Result<T, E> {
    return err(fn());
  }
}

/** Build a {@link Some}. */
export function some<T>(value: T): Option<T> {
  return new Some(value);
}

/** The shared {@link None} singleton. */
export const none: None = new None();

/** `Some(value)` unless `value` is `null` or `undefined`, in which case `None`. */
export function fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>> {
  return value == null ? none : new Some(value as NonNullable<T>);
}

/** Type guard: is this value any `Option`? */
export function isOption(value: unknown): value is Option<unknown> {
  return value instanceof Some || value instanceof None;
}
