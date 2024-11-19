import { lucia } from '@/lib/server/services/auth';
import { redirect } from '@sveltejs/kit';
import userService from '@/lib/server/services/user';

import type { Actions } from './$types';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    const result = await userService.signup(username as string, password as string);
    if (!result.success) {
      return {
        errors: result.errors
      };
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
