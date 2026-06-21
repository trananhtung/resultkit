import { type Result, ok, err } from "./result.js";

/** Coerce an unknown thrown value into an `Error`. */
function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

/**
 * Run `fn` and capture a throw as an `Err` instead of propagating it.
 *
 * ```ts
 * const r = tryCatch(() => JSON.parse(input)); // Result<unknown, Error>
 * ```
 *
 * Pass `mapErr` to transform the caught value (e.g. into a domain error).
 */
export function tryCatch<T>(fn: () => T): Result<T, Error>;
export function tryCatch<T, E>(fn: () => T, mapErr: (error: unknown) => E): Result<T, E>;
export function tryCatch<T, E>(
  fn: () => T,
  mapErr?: (error: unknown) => E,
): Result<T, E | Error> {
  try {
    return ok(fn());
  } catch (thrown) {
    return err(mapErr ? mapErr(thrown) : toError(thrown));
  }
}

/**
 * Await `input` (a promise or a thunk returning one) and capture a rejection
 * as an `Err`.
 *
 * ```ts
 * const r = await tryCatchAsync(() => fetch(url));
 * if (!r.ok) return retryLater(r.error);
 * ```
 */
export function tryCatchAsync<T>(
  input: Promise<T> | (() => Promise<T> | T),
): Promise<Result<T, Error>>;
export function tryCatchAsync<T, E>(
  input: Promise<T> | (() => Promise<T> | T),
  mapErr: (error: unknown) => E,
): Promise<Result<T, E>>;
export async function tryCatchAsync<T, E>(
  input: Promise<T> | (() => Promise<T> | T),
  mapErr?: (error: unknown) => E,
): Promise<Result<T, E | Error>> {
  try {
    const value = await (typeof input === "function" ? input() : input);
    return ok(value);
  } catch (thrown) {
    return err(mapErr ? mapErr(thrown) : toError(thrown));
  }
}

/**
 * Wrap a throwing function into one that returns a `Result`, preserving its
 * argument types.
 *
 * ```ts
 * const safeParse = fromThrowable(JSON.parse);
 * const r = safeParse(input); // Result<unknown, Error>
 * ```
 */
export function fromThrowable<Args extends unknown[], T>(
  fn: (...args: Args) => T,
): (...args: Args) => Result<T, Error>;
export function fromThrowable<Args extends unknown[], T, E>(
  fn: (...args: Args) => T,
  mapErr: (error: unknown) => E,
): (...args: Args) => Result<T, E>;
export function fromThrowable<Args extends unknown[], T, E>(
  fn: (...args: Args) => T,
  mapErr?: (error: unknown) => E,
): (...args: Args) => Result<T, E | Error> {
  return (...args: Args) =>
    mapErr ? tryCatch(() => fn(...args), mapErr) : tryCatch(() => fn(...args));
}
