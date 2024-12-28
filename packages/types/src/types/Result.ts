/**
 * A Result class that represents either a successful value (Ok) or an error (Err).
 * Inspired by Rust's Result type, it provides a way to handle errors in a functional way
 * without throwing exceptions. This enables explicit error handling and type-safe error
 * propagation throughout your codebase.
 *
 * Note: Creating a new Ok result with `undefined` as an argument will always be treated as an error result.
 *
 * @typeparam T The type of the success value
 * @typeparam E The type of the error value
 *
 * @example
 * ```typescript
 * // Creating and using Results
 * const success = Result.ok<number, string>(42);
 * const error = Result.err<string, number>("failed");
 * const undefinedError = Result.ok<number | undefined, string>(undefined); // Treated as an error
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
    private readonly value?: T,
    private readonly error?: E
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a successful Result containing a value.
   * Note: If the value is undefined, it will create an error Result instead.
   *
   * @param value The value to wrap in a successful Result
   * @returns A new Result instance containing the success value, or an error if value is undefined
   *
   * @example
   * ```typescript
   * const result = Result.ok<number, string>(42);
   * console.log(result.isOk()); // true
   *
   * const undefinedResult = Result.ok<number | undefined, string>(undefined);
   * console.log(undefinedResult.isErr()); // true
   * ```
   */
  static ok<T, E = never>(value: T): Result<T, E> {
    if (value === undefined) {
      return new Result<T, E>(undefined, 'Result cannot be created with undefined value' as E);
    }
    return new Result<T, E>(value, undefined);
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
    return new Result<T, E>(undefined, error);
  }

  /**
   * Creates a Result from a JSON string representation.
   * The string should be in the format of either {"ok": value} or {"err": error}.
   *
   * @param str The JSON string to parse
   * @returns A new Result instance parsed from the string or a Result containing a `SyntaxError` if the string is invalid.
   *
   * @example
   * ```typescript
   * const success = Result.fromString('{"ok": 42}');
   * const error = Result.fromString('{"err": "not found"}');
   * ```
   */
  static fromString<T, E>(str: string): Result<T, E> {
    try {
      const value = JSON.parse(str);
      if ('ok' in value) {
        return new Result<T, E>(value.ok, undefined);
      } else {
        return new Result<T, E>(undefined, value.err);
      }
    } catch (e) {
      return new Result<T, E>(undefined, e as E);
    }
  }

  static fromJSON<T, E>(json: { ok: T } | { err: E }): Result<T, E> {
    if ('ok' in json) {
      return new Result<T, E>(json.ok, undefined);
    } else {
      return new Result<T, E>(undefined, json.err);
    }
  }

  /**
   * Returns the contained Ok value if present, otherwise undefined.
   * This is a safe way to access the Ok value without throwing.
   *
   * @returns The contained value if Ok, otherwise undefined
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * console.log(success.ok()); // 42
   *
   * const error = Result.err<number, string>("failed");
   * console.log(error.ok()); // undefined
   * ```
   */
  ok(): T | undefined {
    if (this.isOk()) {
      return this.value!;
    }
    return undefined;
  }

  /**
   * Returns the contained Err value if present, otherwise undefined.
   * This is a safe way to access the Err value without throwing.
   *
   * @returns The contained error if Err, otherwise undefined
   *
   * @example
   * ```typescript
   * const error = Result.err<number, string>("failed");
   * console.log(error.err()); // "failed"
   *
   * const success = Result.ok<number, string>(42);
   * console.log(success.err()); // undefined
   * ```
   */
  err(): E | undefined {
    if (this.isErr()) {
      return this.error!;
    }
    return undefined;
  }

  /**
   * Returns true if the Result is Ok.
   * This is a type guard that narrows the type to Result<T, never>.
   *
   * @returns true if the Result contains a success value
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * if (success.isOk()) {
   *   // TypeScript knows success.value is number
   *   console.log(success.value);
   * }
   * ```
   */
  isOk(): this is Result<T, never> {
    return 'value' in this && this.value !== undefined;
  }

  /**
   * Returns true if the Result is Ok and the value satisfies the provided predicate.
   *
   * @param fn Predicate function to apply to the value
   * @returns true if the Result is Ok and the value satisfies the predicate
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * if (success.isOkAnd(x => x > 0)) {
   *   // TypeScript knows success.unwrap() is number
   *   console.log(success.unwrap());
   * }
   * ```
   */
  isOkAnd(fn: (value: T) => boolean): this is Result<T, never> {
    return this.isOk() && fn(this.value!);
  }

  /**
   * Returns true if the Result is Err.
   * This is a type guard that narrows the type to Result<never, E>.
   *
   * @returns true if the Result contains an error value
   *
   * @example
   * ```typescript
   * const error = Result.err<number, string>("failed");
   * if (error.isErr()) {
   *   // TypeScript knows error.error is string
   *   console.log(error.error);
   * }
   * ```
   */
  isErr(): this is Result<never, E> {
    return !this.isOk();
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
  unwrap(): T {
    if (this.isOk()) {
      return this.value!;
    }
    throw this.error!;
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
  unwrapOr(defaultValue: T): T {
    return this.isOk() ? this.value! : defaultValue;
  }

  /**
   * Unwraps the Result, returning the contained error if Err or throwing the value if Ok.
   * This is the opposite of `unwrap()`. It should be used with caution as it can throw.
   * Consider using `match` for safer error handling.
   *
   * @throws The contained value if the Result is Ok
   * @returns The contained error if the Result is Err
   *
   * @example
   * ```typescript
   * const error = Result.err<number, string>("not found");
   * console.log(error.unwrapErr()); // "not found"
   *
   * const success = Result.ok<number, string>(42);
   * // success.unwrapErr(); // throws 42
   * ```
   */
  unwrapErr(): E {
    if (this.isErr()) {
      return this.error!;
    }
    throw this.value!;
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
  map<U>(fn: (value: T) => U): Result<U, E> {
    return this.isOk() ? Result.ok(fn(this.value!)) : Result.err(this.error!);
  }

  /**
   * Maps a Result<T, E> to a value of type U.
   * If the Result is Ok, applies the function to the value.
   * If the Result is Err, applies the default function to the error.
   *
   * @param defaultFn Function to apply if the Result is Err
   * @param fn Function to apply if the Result is Ok
   * @returns The result of applying the function to the value or error
   */
  mapOrElse<U>(defaultFn: (error: E) => U, fn: (value: T) => U): U {
    return this.isOk() ? fn(this.value!) : defaultFn(this.error!);
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
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return this.isErr() ? Result.err(fn(this.error!)) : Result.ok(this.value!);
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
  or(other: Result<T, E>): Result<T, E> {
    return this.isOk() ? this : other;
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
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return this.isOk() ? fn(this.value!) : Result.err(this.error!);
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
  match<U, V>(options: { ok: (value: T) => U; err: (error: E) => V }): U | V {
    return this.isOk() ? options.ok(this.value!) : options.err(this.error!);
  }

  /**
   * Returns a JSON string representation of the Result.
   * The string is in the format of either {"ok": value} or {"err": error}.
   *
   * @returns A JSON string representation of the Result
   *
   * @example
   * ```typescript
   * const success = Result.ok<number, string>(42);
   * console.log(success.toString()); // {"ok": 42}
   *
   * const error = Result.err<number, string>("failed");
   * console.log(error.toString()); // {"err": "failed"}
   * ```
   */
  toJSON(): { ok: T } | { err: E } {
    if (this.isOk()) {
      return { ok: this.value! };
    } else {
      return { err: this.error instanceof Error ? (this.error.message as E) : this.error! };
    }
  }
}
