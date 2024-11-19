import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';
import { getClient } from '../data/db';
import { userSchema } from '../data/schema/user';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { LoginResult } from '@/types/auth/LoginResult';
import type { SignupResult } from '@/types/auth/SignupResult';
import type { ValidationResult } from '@/types/auth/ValidationResult';

const validateUserForm = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9_-]+$/i, 'Username must only consist of lowercase letters, 0-9, -, and _')
    .min(4, 'Username must be between 4 ~ 31 characters')
    .max(31, 'Username must be between 4 ~ 31 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password too long')
});

const validateUser = async (username: string, password: string): Promise<ValidationResult> => {
  const result = validateUserForm.safeParse({ username, password });
  if (!result.success) {
    return {
      success: false,
      errors: result.error.formErrors.fieldErrors
    };
  }
  return { success: true };
};

const login = async (username: string, password: string): Promise<LoginResult> => {
  const validation = await validateUser(username, password);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors
    };
  }

  const db = getClient();
  const existingUser = (
    await db.select().from(userSchema).where(eq(userSchema.username, username)).execute()
  )[0];

  // Simulate a delay to prevent timing attacks
  //TODO: Replace with a better solution
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!existingUser) {
    return {
      success: false,
      error: 'Incorrect username or password'
    };
  }

  const validPassword = await new Argon2id().verify(existingUser.hashedPassword, password);
  if (!validPassword) {
    return {
      success: false,
      error: 'Incorrect username or password'
    };
  }

  return {
    success: true,
    user: existingUser
  };
};

const signup = async (username: string, password: string): Promise<SignupResult> => {
  const validation = await validateUser(username, password);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors
    };
  }

  const db = getClient();
  const usernameExists = await db
    .select()
    .from(userSchema)
    .where(eq(userSchema.username, username))
    .execute();

  if (usernameExists.length > 0) {
    return {
      success: false,
      errors: {
        username: ['Username already exists']
      }
    };
  }

  const userId = generateId(15);
  const hashedPassword = await new Argon2id().hash(password);

  await db.insert(userSchema).values({
    id: userId,
    username,
    hashedPassword
  });

  return {
    success: true,
    userId
  };
};

export default {
  validateUser,
  login,
  signup
};
