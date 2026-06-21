import { type Option, some, none } from "./option.js";

/**
 * A `Result<T, E>` is either an {@link Ok}`<T>` holding a success value, or an
 * {@link Err}`<E>` holding a failure value. It is the type-safe alternative to
 * `throw`: errors become values you must handle, and TypeScript narrows on the
 * `.ok` discriminant.
 *
 * ```ts
 * const r = parse(input);          // Result<number, string>
 * if (r.ok) doSomething(r.value);  // narrowed to Ok
 * else console.warn(r.error);      // narrowed to Err
 * ```
 */
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

/** Methods shared by {@link Ok} and {@link Err}. */
interface ResultMethods<T, E> {
  /** Narrows to {@link Ok} when `true`. */
  isOk(): this is Ok<T, E>;
  /** Narrows to {@link Err} when `true`. */
  isErr(): this is Err<T, E>;
  /** Map the success value, leaving an `Err` untouched. */
  map<U>(fn: (value: T) => U): Result<U, E>;
  /** Map the error value, leaving an `Ok` untouched. */
  mapErr<F>(fn: (error: E) => F): Result<T, F>;
  /** Chain a fallible step on the success value (a.k.a. `flatMap`). */
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>;
  /** Recover from an error by producing another `Result`. */
  orElse<U, F>(fn: (error: E) => Result<U, F>): Result<T | U, F>;
  /** The success value, or throw if this is an `Err`. */
  unwrap(): T;
  /** The error value, or throw if this is an `Ok`. */
  unwrapErr(): E;
  /** The success value, or `fallback` if this is an `Err`. */
  unwrapOr<U>(fallback: U): T | U;
  /** The success value, or `fn(error)` if this is an `Err`. */
  unwrapOrElse<U>(fn: (error: E) => U): T | U;
  /** Fold both branches into a single value. */
  match<A, B>(matchers: { ok: (value: T) => A; err: (error: E) => B }): A | B;
  /** Run a side effect on the success value; returns `this` for chaining. */
  tap(fn: (value: T) => void): Result<T, E>;
  /** Run a side effect on the error value; returns `this` for chaining. */
  tapErr(fn: (error: E) => void): Result<T, E>;
  /** `Some(value)` for `Ok`, `None` for `Err` (the error is discarded). */
  toOption(): Option<T>;
}

/** The success branch of a {@link Result}. Created via {@link ok}. */
export class Ok<T, E = never> implements ResultMethods<T, E> {
  readonly ok = true as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }
  isErr(): this is Err<T, E> {
    return false;
  }
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }
  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok(this.value);
  }
  andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }
  orElse<U, F>(_fn: (error: E) => Result<U, F>): Result<T | U, F> {
    return new Ok(this.value);
  }
  unwrap(): T {
    return this.value;
  }
  unwrapErr(): E {
    throw new TypeError(
      `Called unwrapErr() on an Ok value: ${stringify(this.value)}`,
    );
  }
  unwrapOr<U>(_fallback: U): T | U {
    return this.value;
  }
  unwrapOrElse<U>(_fn: (error: E) => U): T | U {
    return this.value;
  }
  match<A, B>(matchers: { ok: (value: T) => A; err: (error: E) => B }): A | B {
    return matchers.ok(this.value);
  }
  tap(fn: (value: T) => void): Result<T, E> {
    fn(this.value);
    return this;
  }
  tapErr(_fn: (error: E) => void): Result<T, E> {
    return this;
  }
  toOption(): Option<T> {
    return some(this.value);
  }
}

/** The failure branch of a {@link Result}. Created via {@link err}. */
export class Err<T, E> implements ResultMethods<T, E> {
  readonly ok = false as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }
  isErr(): this is Err<T, E> {
    return true;
  }
  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error);
  }
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }
  andThen<U, F>(_fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return new Err(this.error);
  }
  orElse<U, F>(fn: (error: E) => Result<U, F>): Result<T | U, F> {
    return fn(this.error);
  }
  unwrap(): T {
    if (this.error instanceof Error) throw this.error;
    throw new TypeError(`Called unwrap() on an Err value: ${stringify(this.error)}`);
  }
  unwrapErr(): E {
    return this.error;
  }
  unwrapOr<U>(fallback: U): T | U {
    return fallback;
  }
  unwrapOrElse<U>(fn: (error: E) => U): T | U {
    return fn(this.error);
  }
  match<A, B>(matchers: { ok: (value: T) => A; err: (error: E) => B }): A | B {
    return matchers.err(this.error);
  }
  tap(_fn: (value: T) => void): Result<T, E> {
    return this;
  }
  tapErr(fn: (error: E) => void): Result<T, E> {
    fn(this.error);
    return this;
  }
  toOption(): Option<T> {
    return none;
  }
}

/** Build an {@link Ok}. */
export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

/** Build an {@link Err}. */
export function err<E, T = never>(error: E): Result<T, E> {
  return new Err(error);
}

/** Type guard: is this value any `Result`? */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  return value instanceof Ok || value instanceof Err;
}

function stringify(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
