import { fail, redirect } from '@sveltejs/kit';
import userService from '@/server/services/user.service';

import type { Actions } from './$types';
import { createSession, generateSessionCookie, generateSessionToken } from '@/server/services/auth.service';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      const errors: Record<string, string[]> = {
        username: ['Invalid or missing username'],
        password: ['Invalid or missing password']
      };
      return fail(400, {
        message: 'Invalid username or password',
        errors
      });
    }

    const result = await userService.signup(username, password);
    if (!result.success) {
      return fail(400, {
        errors: result.errors
      });
    }

    const token = generateSessionToken();

    const session = await createSession(token, result.userId);
    const sessionCookie = generateSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, token, sessionCookie.attributes);

    return redirect(302, '/');
  }
};
