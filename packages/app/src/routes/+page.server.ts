import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  authSessionResult.match({
    ok: (authSession) => {
      if (authSession) {
        redirect(302, '/feeds');
      }
    },
    err: (e) => {
      error(500, e.message);
    }
  });
};
