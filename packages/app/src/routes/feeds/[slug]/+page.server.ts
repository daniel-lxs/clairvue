import collectionService from '@/server/services/collection.service';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';

export const load = (async ({ cookies, params, depends }) => {
  // Add dependency on feeds data
  depends('feeds');

  const slug = params.slug;
  if (!slug) {
    error(400, 'Invalid slug');
  }

  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    err: (e) => error(500, e.message),
    ok: async (authSession) => {
      if (!authSession) {
        redirect(302, '/auth/login');
      }

      const collectionsResult = await collectionService.findByUserIdWithFeeds(authSession.user.id);

      if (collectionsResult.isErr()) {
        error(500, collectionsResult.unwrapErr().message);
      }

      const collections = collectionsResult.unwrap();

      if (!collections) {
        error(404, 'Collections not found');
      }

      // Find the requested collection by slug
      const selectedCollection = collections.find((collection) => collection.slug === params.slug);
    
      const defaultCollection = collections.find((collection) => collection.id.startsWith('default-'));
    
      if (!selectedCollection || !defaultCollection) {
        error(404, 'Collections not found');
      }
    
      return {
        collection: selectedCollection,
        collections,
        defaultCollection,
        userId: authSession.user.id
      };
    }
  });


}) satisfies PageServerLoad;
