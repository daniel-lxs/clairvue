import { lucia } from '@/server/services/auth';
import { redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';

import type { Actions } from './$types';
import { getClient } from '@/server/data/db';
import { userSchema } from '@/server/data/schema/user';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	default: async (event) => {
		console.log('event', event);
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
		// keep in mind some database (e.g. mysql) are case insensitive

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
				errors: result.error.formErrors.fieldErrors
			};
		}
		const db = getClient();

		const usernameExists = await db
			.select()
			.from(userSchema)
			.where(eq(userSchema.username, username as string))
			.execute();
		if (usernameExists.length > 0) {
			return {
				errors: {
					username: ['Username already exists']
				}
			};
		}

		const userId = generateId(15);
		const hashedPassword = await new Argon2id().hash(password as string);

		await db.insert(userSchema).values({
			id: userId,
			username: username as string,
			hashedPassword
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};
