import type { User } from '@/server/data/schema';

interface LoginSuccess {
  success: true;
  user: User;
}

interface LoginError {
  success: false;
  error?: string;
  errors?: Record<string, string[] | undefined>;
}

export type LoginResult = LoginSuccess | LoginError;
