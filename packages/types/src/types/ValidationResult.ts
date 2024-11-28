interface ValidationSuccess {
  success: true;
}

interface ValidationError {
  success: false;
  errors: Record<string, string[] | undefined>;
}

export type ValidationResult = ValidationSuccess | ValidationError;
