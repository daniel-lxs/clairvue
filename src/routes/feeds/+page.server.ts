import { findCollectionsByUserId } from '@/server/services/collection.service';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
  const authSession = await validateAuthSession(cookies);
  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const collections = await findCollectionsByUserId(authSession.user.id, true);
  const defaultCollection = collections?.find((collection) => collection.id.startsWith('default-'));
  const otherCollections = collections?.filter(
    (collection) => !collection.id.startsWith('default-')
  );

  return {
    collections: otherCollections || [],
    defaultCollection,
    userId: authSession.user.id
  };
}) satisfies PageServerLoad;
