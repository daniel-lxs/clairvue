import { lucia } from '@/server/services/auth';
import { fail, redirect } from '@sveltejs/kit';
import userService from '@/server/services/user';

import type { Actions } from './$types';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      throw fail(400, {
        message: 'Invalid username or password'
      });
    }

    const result = await userService.signup(username, password);
    if (!result.success) {
      throw fail(400, {
        errors: result.errors
      });
    }

    const session = await lucia.createSession(result.userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    throw redirect(302, '/');
  }
};
