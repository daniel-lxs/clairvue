import { fail, redirect } from '@sveltejs/kit';
import userService from '@/server/services/user.service';

import type { Actions } from './$types';
import authService from '@/server/services/auth.service';

export const actions: Actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return fail(400, {
        errors: ['Invalid username or password']
      });
    }

    const result = await userService.signup(username, password);

    return result.match({
      ok: async (user) => {
        const token = authService.generateSessionToken();
        const sessionResult = await authService.createSession(token, user.id);

        if (sessionResult.isErr()) {
          return fail(500, {
            errors: ['Failed to create session']
          });
        }

        const session = sessionResult.unwrap();
        const sessionCookie = authService.generateSessionCookie(session.id);
        event.cookies.set(sessionCookie.name, token, sessionCookie.attributes);

        return redirect(302, '/');
      },
      err: (errors) => {
        return fail(400, {
          errors: errors
        });
      }
    });
  }
};
