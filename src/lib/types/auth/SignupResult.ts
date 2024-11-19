interface SignupSuccess {
  success: true;
  userId: string;
}

interface SignupError {
  success: false;
  errors: Record<string, string[] | undefined>;
}

export type SignupResult = SignupSuccess | SignupError;
