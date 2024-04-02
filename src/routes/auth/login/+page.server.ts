import { lucia } from '@/server/services/auth';
import { fail, redirect } from '@sveltejs/kit';
import { Argon2id } from 'oslo/password';

import type { Actions } from './$types';
import { eq } from 'drizzle-orm';
import { getClient } from '@/server/data/db';
import { userSchema } from '@/server/data/schema';
import { z } from 'zod';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    const validateForm = z.object({
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

    const result = validateForm.safeParse({ username, password });
    if (!result.success) {
      return {
        message: 'Invalid username or password',
        errors: result.error.formErrors.fieldErrors
      };
    }

    const db = getClient();

    const existingUser = (
      await db
        .select()
        .from(userSchema)
        .where(eq(userSchema.username, username as string))
        .execute()
    )[0]; //TODO: it's necessary to improve this by rate limiting

    // Simulate a delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!existingUser) {
      return fail(400, {
        message: 'Incorrect username or password'
      });
    }

    const validPassword = await new Argon2id().verify(
      existingUser.hashedPassword,
      password as string
    );
    if (!validPassword) {
      return fail(400, {
        message: 'Incorrect username or password'
      });
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    redirect(302, '/');
  }
};
