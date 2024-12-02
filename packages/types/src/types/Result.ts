/**
 * A Result class that represents either a successful value (Ok) or an error (Err).
 * Inspired by Rust's Result type, it provides a way to handle errors in a functional way
 * without throwing exceptions. This enables explicit error handling and type-safe error
 * propagation throughout your codebase.
 *
 * @typeparam T The type of the success value
 * @typeparam E The type of the error value
 *
 * @example
 * ```typescript
 * // Creating and using Results
 * const success = Result.ok<number, string>(42);
 * const error = Result.err<string, number>("failed");
 *
 * // Pattern matching
 * success.match({
 *   ok: (value) => console.log(`Success: ${value}`),
 *   err: (error) => console.error(`Error: ${error}`)
 * });
 * ```
 */
export class Result<T, E> {
  private constructor(
    private readonly value?: T | undefined,
    private readonly error?: E,
    readonly isOk: boolean = true
  ) {
    Object.freeze(this);
  }

  get isErr(): boolean {
    return !this.isOk;
  }

  /**
   * Creates a successful Result containing a value.
   *
   * @param value The value to wrap in a successful Result
   * @returns A new Result instance containing the success value
   *
   * @example
   * ```typescript
   * const result = Result.ok<number, string>(42);
   * console.log(result.isOk); // true
   * ```
   */
  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined, true);
  }

  /**
   * Creates an error Result containing an error value.
   *
   * @param error The error value to wrap in a Result
   * @returns A new Result instance containing the error
   *
   * @example
   * ```typescript
   * const result = Result.err<string, number>("not found");
   * console.log(result.isErr); // true
   * ```
   */
  static err<E, T = never>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error, false);
  }

  /**
   * Unwraps the Result, returning the contained value if Ok or throwing the error if Err.
   * This should be used with caution as it can throw an exception.
   * Consider using `unwrapOr` or `match` for safer alternatives.
   *
   * @throws The contained error if the Result is Err
   * @returns The contained value if the Result is Ok
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * console.log(success.unwrap()); // 42
   *
   * const error = Result.err<string, number>("failed");
   * // error.unwrap(); // throws "failed"
   * ```
   */
  unwrap(): T | undefined {
    if (this.isOk) {
      return this.value;
    }
    throw this.error;
  }

  /**
   * Returns the contained Ok value or a provided default value.
   * This is a safe alternative to `unwrap()` as it never throws.
   *
   * @param defaultValue The value to return if the Result is Err
   * @returns The contained value if Ok, otherwise the default value
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * console.log(success.unwrapOr(0)); // 42
   *
   * const error = Result.err<string, number>("failed");
   * console.log(error.unwrapOr(0)); // 0
   * ```
   */
  unwrapOr(defaultValue: T): T | undefined {
    return this.isOk ? this.value : defaultValue;
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value.
   * If the Result is Err, the error is propagated without modification.
   *
   * @param fn Function to apply to the contained value if Ok
   * @returns A new Result with the mapped value if Ok, or the original error if Err
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * const mapped = success.map(x => x.toString()); // Result<string, string>
   * console.log(mapped.unwrap()); // "42"
   * ```
   */
  map<U>(fn: (value: T | undefined) => U): Result<U, E> {
    return this.isOk ? Result.ok(fn(this.value)) : Result.err(this.error!);
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value.
   * If the Result is Ok, the value is propagated without modification.
   *
   * @param fn Function to apply to the contained error if Err
   * @returns A new Result with the mapped error if Err, or the original value if Ok
   *
   * @example
   * ```typescript
   * const error = Result.err<string, number>("failed");
   * const mapped = error.mapErr(e => new Error(e)); // Result<number, Error>
   * ```
   */
  mapErr<F>(fn: (error: E) => F): Result<T | undefined, F> {
    return this.isErr ? Result.err(fn(this.error!)) : Result.ok(this.value);
  }

  /**
   * Returns the current Result if Ok, otherwise returns the provided alternative Result.
   * This is useful for providing fallback values in a chain of operations.
   *
   * @param other The alternative Result to return if this Result is Err
   * @returns This Result if Ok, otherwise the provided Result
   *
   * @example
   * ```typescript
   * const error = Result.err<string, number>("failed");
   * const fallback = Result.ok<number, string>(42);
   * const result = error.or(fallback);
   * console.log(result.unwrap()); // 42
   * ```
   */
  or(other: Result<T | undefined, E>): Result<T | undefined, E> {
    return this.isOk ? this : other;
  }

  /**
   * Chains multiple Results together by applying a function that returns a Result.
   * If this Result is Ok, applies the function to the value. If Err, returns the error.
   * This is useful for composing multiple operations that might fail.
   *
   * @param fn Function that takes the Ok value and returns a new Result
   * @returns The Result of applying fn if Ok, or the original error if Err
   *
   * @example
   * ```typescript
   * const divide = (x: number): Result<number, string> =>
   *   x === 0 ? Result.err("divide by zero") : Result.ok(100 / x);
   *
   * const success = Result.ok<number, string>(4)
   *   .andThen(divide); // Result.ok(25)
   *
   * const error = Result.ok<number, string>(0)
   *   .andThen(divide); // Result.err("divide by zero")
   * ```
   */
  andThen<U>(fn: (value: T | undefined) => Result<U, E>): Result<U, E> {
    return this.isOk ? fn(this.value) : Result.err(this.error!);
  }

  /**
   * Pattern matches on the Result and handles both Ok and Err cases.
   * This is the most flexible way to handle a Result as it ensures both cases are handled.
   *
   * @param options Object containing handler functions for both Ok and Err cases
   * @returns The value returned by either the ok or err handler
   *
   * @example
   * ```typescript
   * const result = Result.ok<number, string>(42);
   * const message = result.match({
   *   ok: (value) => `Success: ${value}`,
   *   err: (error) => `Error: ${error}`
   * });
   * console.log(message); // "Success: 42"
   * ```
   */
  match<U, V>(options: { ok: (value: T | undefined) => U; err: (error: E) => V }): U | V {
    return this.isOk ? options.ok(this.value) : options.err(this.error!);
  }
}
