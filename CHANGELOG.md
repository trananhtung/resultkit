# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-21

### Added

- `Result<T, E>` — `ok` / `err` with `.ok` discriminant narrowing and fluent
  `map`, `mapErr`, `andThen`, `orElse`, `unwrap`, `unwrapErr`, `unwrapOr`,
  `unwrapOrElse`, `match`, `tap`, `tapErr`, `toOption`, `isOk` / `isErr`.
- `Option<T>` — `some` / `none` / `fromNullable` with `map`, `andThen`, `filter`,
  `orElse`, `unwrap`, `unwrapOr`, `unwrapOrElse`, `match`, `tap`, `okOr` /
  `okOrElse`, `isSome` / `isNone`.
- `tryCatch`, `tryCatchAsync` (promise or thunk), and `fromThrowable` to bridge
  throwing code into `Result`, with optional `mapErr`. Non-`Error` throws are
  coerced to `Error`.
- Combinators: `all` (tuple-typed, short-circuits), `any`, `partition`.
- `isResult` / `isOption` type guards.
- ESM + CJS builds, types, and CI across Node 18 / 20 / 22.
