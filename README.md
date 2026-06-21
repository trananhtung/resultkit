# trykit

> Tiny, type-safe **`Result`** and **`Option`** for TypeScript — fluent methods, `.ok` / `.some` narrowing, `tryCatch` / `tryCatchAsync`, and combinators. **Zero dependencies**.

[![CI](https://github.com/trananhtung/trykit/actions/workflows/ci.yml/badge.svg)](https://github.com/trananhtung/trykit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/trykit.svg)](https://www.npmjs.com/package/trykit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/trykit)](https://bundlephobia.com/package/trykit)
[![types](https://img.shields.io/npm/types/trykit.svg)](https://www.npmjs.com/package/trykit)
[![license](https://img.shields.io/npm/l/trykit.svg)](./LICENSE)

`throw` is an invisible control-flow channel: the type system never tells you a
function can fail, so the `catch` is easy to forget. `trykit` turns failure into
a **value** — `Result<T, E>` — that you must handle, and `Option<T>` for "might
be absent" without `null` juggling. Both narrow on a plain discriminant, so you
can stay fluent **or** drop into a normal `if`.

```ts
import { tryCatch } from "trykit";

const config = tryCatch(() => JSON.parse(raw))
  .map((c) => c.timeout ?? 5000)
  .unwrapOr(5000);
// no try/catch, no `any` leaking out — just a number
```

## Why trykit?

- **Two primitives, one tiny package.** `Result` for success-or-failure,
  `Option` for present-or-absent. ESM + CJS + types, **zero deps**.
- **Narrow however you like.** `if (r.ok)` / `if (o.some)` discriminants for the
  TypeScript-native style, **or** fluent `.map().andThen().unwrapOr()` chains.
- **Bridge throwing code in one call.** `tryCatch`, `tryCatchAsync` (promise *or*
  thunk), and `fromThrowable` wrap any throwing API into a `Result`.
- **Real combinators.** `all` (tuple-typed), `any`, and `partition` for working
  with lists of results.
- **Exhaustive `match`.** Fold both branches into one value with no fallthrough.

## Install

```bash
npm install trykit
# or: pnpm add trykit  /  yarn add trykit  /  bun add trykit
```

## `Result<T, E>`

```ts
import { ok, err, type Result } from "trykit";

function parsePort(input: string): Result<number, string> {
  const n = Number(input);
  if (!Number.isInteger(n)) return err(`not an integer: ${input}`);
  if (n < 1 || n > 65535) return err(`out of range: ${n}`);
  return ok(n);
}

const r = parsePort("8080");

// 1. Discriminant narrowing
if (r.ok) console.log(r.value); // number
else console.warn(r.error);     // string

// 2. Fluent
parsePort("70000")
  .map((p) => p + 1)
  .mapErr((e) => new Error(e))
  .match({
    ok: (p) => listen(p),
    err: (e) => log(e),
  });
```

| Method | Description |
| --- | --- |
| `map(fn)` / `mapErr(fn)` | Transform the value / the error |
| `andThen(fn)` | Chain a fallible step (`flatMap`) |
| `orElse(fn)` | Recover from an error with another `Result` |
| `unwrap()` / `unwrapErr()` | Extract value / error, throwing otherwise |
| `unwrapOr(x)` / `unwrapOrElse(fn)` | Extract with a fallback |
| `match({ ok, err })` | Fold both branches |
| `tap(fn)` / `tapErr(fn)` | Side effects, returns `this` |
| `toOption()` | Drop the error → `Option` |
| `isOk()` / `isErr()` | Type guards |

## `Option<T>`

```ts
import { fromNullable, some, none, type Option } from "trykit";

const port: Option<number> = fromNullable(process.env.PORT)
  .map(Number)
  .filter(Number.isInteger);

port.unwrapOr(3000);                 // number
port.okOr("PORT is missing");        // Result<number, string>
port.match({ some: listen, none: () => listen(3000) });
```

`map`, `andThen`, `filter`, `orElse`, `unwrap`, `unwrapOr`, `unwrapOrElse`,
`match`, `tap`, `okOr` / `okOrElse`, `isSome` / `isNone`. `none` is a shared
singleton; `fromNullable` keeps falsy-but-present values (`0`, `""`, `false`).

## Bridging throwing code

```ts
import { tryCatch, tryCatchAsync, fromThrowable } from "trykit";

tryCatch(() => JSON.parse(raw));                 // Result<unknown, Error>
tryCatch(() => risky(), (e) => new MyError(e));  // custom error mapping

await tryCatchAsync(() => fetch(url));           // promise or thunk → Result
await tryCatchAsync(fetch(url));

const safeParse = fromThrowable(JSON.parse);     // reusable wrapper
safeParse(raw).unwrapOr({});
```

Non-`Error` throws are coerced to `Error` (unless you pass `mapErr`), so an
`Err` always carries something useful.

## Combinators

```ts
import { all, any, partition, ok, err } from "trykit";

all([ok(1), ok("two"), ok(true)]); // Ok<[number, string, boolean]>  (tuple-typed)
all([ok(1), err("nope")]);         // Err("nope")  — short-circuits on first error

any([err("a"), ok(2)]);            // Ok(2) — first success, else Err of all errors

partition([ok(1), err("x"), ok(2)]); // { oks: [1, 2], errs: ["x"] }
```

## Pairs well with

| Need | Use |
| --- | --- |
| Retry a failed `Result`-returning call | [`retryfn`](https://www.npmjs.com/package/retryfn) |
| Add a timeout to the awaited work | [`timefence`](https://www.npmjs.com/package/timefence) |
| Validate env into typed config | [`envguard`](https://www.npmjs.com/package/envguard) |
| Repair messy LLM JSON before `tryCatch(JSON.parse)` | [`jsonpluck`](https://www.npmjs.com/package/jsonpluck) |

## License

[MIT](./LICENSE) © Tung Tran
