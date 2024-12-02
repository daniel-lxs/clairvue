/**
 * A Result class that represents either a successful value (Ok) or an error (Err).
 * This is inspired by Rust's Result type and provides a way to handle errors
 * in a functional way.
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
   * Creates a successful Result containing a value
   */
  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined, true);
  }

  /**
   * Creates an error Result containing an error
   */
  static err<E, T = never>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error, false);
  }

  /**
   * Unwraps the Result, returning the value if Ok or throwing the error if Err
   */
  unwrap(): T | undefined {
    if (this.isOk) {
      return this.value;
    }
    throw this.error;
  }

  /**
   * Returns the contained Ok value or a provided default
   */
  unwrapOr(defaultValue: T): T | undefined {
    return this.isOk ? this.value : defaultValue;
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value
   */
  map<U>(fn: (value: T | undefined) => U): Result<U, E> {
    return this.isOk ? Result.ok(fn(this.value)) : Result.err(this.error!);
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value
   */
  mapErr<F>(fn: (error: E) => F): Result<T | undefined, F> {
    return this.isErr ? Result.err(fn(this.error!)) : Result.ok(this.value);
  }

  /**
   * Returns result if Ok, otherwise returns other
   */
  or(other: Result<T | undefined, E>): Result<T | undefined, E> {
    return this.isOk ? this : other;
  }

  /**
   * Chains multiple Results together. If result is Ok, applies fn to the value.
   * If result is Err, returns the Err value.
   */
  andThen<U>(fn: (value: T | undefined) => Result<U, E>): Result<U, E> {
    return this.isOk ? fn(this.value) : Result.err(this.error!);
  }

  /**
   * Match on the result and handle both cases
   */
  match<U, V>(options: { ok: (value: T | undefined) => U; err: (error: E) => V }): U | V {
    return this.isOk ? options.ok(this.value) : options.err(this.error!);
  }
}
