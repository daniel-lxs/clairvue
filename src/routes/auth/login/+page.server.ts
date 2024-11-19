import { lucia } from '@/server/services/auth';
import { fail, redirect } from '@sveltejs/kit';
import userService from '@/server/services/user';

import type { Actions } from './$types';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    const result = await userService.login(username as string, password as string);
    if (!result.success) {
      return fail(400, {
        message: result.error,
        errors: result.errors
      });
    }

    const session = await lucia.createSession(result.user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    event.cookies.set(sessionCookie.name, sessionCookie.value, {
      path: '.',
      ...sessionCookie.attributes
    });

    throw redirect(302, '/');
  }
};
