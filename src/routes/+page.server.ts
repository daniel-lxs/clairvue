import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
  const authSession = await validateAuthSession(cookies);

  if (!authSession) {
    return {
      session: null
    };
  }

  redirect(302, '/boards');
};
