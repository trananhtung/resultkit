import { type Result, ok, err } from "./result.js";

/** Extract the success type from a `Result`. */
type OkOf<R> = R extends Result<infer T, unknown> ? T : never;
/** Extract the error type from a `Result`. */
type ErrOf<R> = R extends Result<unknown, infer E> ? E : never;

/**
 * Combine a tuple/array of `Result`s into a single `Result` of the values.
 * Short-circuits on the **first** `Err`.
 *
 * ```ts
 * all([ok(1), ok(2)]);       // Ok([1, 2])
 * all([ok(1), err("nope")]); // Err("nope")
 * ```
 */
export function all<const Results extends readonly Result<unknown, unknown>[]>(
  results: Results,
): Result<{ -readonly [K in keyof Results]: OkOf<Results[K]> }, ErrOf<Results[number]>> {
  const values: unknown[] = [];
  for (const result of results) {
    if (!result.ok) return result as Result<never, ErrOf<Results[number]>>;
    values.push(result.value);
  }
  return ok(values as { -readonly [K in keyof Results]: OkOf<Results[K]> });
}

/**
 * Return the first `Ok` in the list, or an `Err` holding **all** errors if
 * every entry failed.
 *
 * ```ts
 * any([err("a"), ok(2), err("c")]); // Ok(2)
 * any([err("a"), err("b")]);        // Err(["a", "b"])
 * ```
 */
export function any<const Results extends readonly Result<unknown, unknown>[]>(
  results: Results,
): Result<OkOf<Results[number]>, ErrOf<Results[number]>[]> {
  const errors: unknown[] = [];
  for (const result of results) {
    if (result.ok) return result as Result<OkOf<Results[number]>, never>;
    errors.push(result.error);
  }
  return err(errors as ErrOf<Results[number]>[]);
}

/**
 * Partition a list of `Result`s into the array of success values and the array
 * of errors, preserving order within each.
 */
export function partition<T, E>(
  results: readonly Result<T, E>[],
): { oks: T[]; errs: E[] } {
  const oks: T[] = [];
  const errs: E[] = [];
  for (const result of results) {
    if (result.ok) oks.push(result.value);
    else errs.push(result.error);
  }
  return { oks, errs };
}
