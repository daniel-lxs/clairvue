import { Session, User } from './User';

interface LoginSuccess {
  success: true;
  user: User;
}

interface LoginError {
  success: false;
  error?: string;
  errors?: Record<string, string[]>;
}

export type LoginResult = LoginSuccess | LoginError;

interface SignupSuccess {
  success: true;
  userId: string;
}

interface SignupError {
  success: false;
  errors?: Record<string, string[]>;
}

export type SignupResult = SignupSuccess | SignupError;

export interface SessionValidationResult {
  session: Session | null;
  user: User | null;
}
