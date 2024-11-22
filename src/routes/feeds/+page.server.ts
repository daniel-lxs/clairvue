import collectionService from '@/server/services/collection.service';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import feedService from '@/server/services/feed.service';

export const load = (async ({ cookies, depends }) => {
  // Add dependency on feeds data
  depends('app:feeds');

  const authSession = await validateAuthSession(cookies);
  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const collections = await collectionService.findByUserId(authSession.user.id, true);

  if (!collections) {
    throw new Error('Collections not found');
  }

  await Promise.all(
    collections.map(async (collection) => {
      if (collection.feeds) {
        await Promise.all(
          collection.feeds.map(async (feed) => {
            feed.articleCount = await feedService.countArticles(feed.id);
          })
        );
      }
    })
  );

  const defaultCollection = collections.find((collection) => collection.id.startsWith('default-'));
  const otherCollections = collections.filter(
    (collection) => !collection.id.startsWith('default-')
  );

  if (!defaultCollection || !defaultCollection.feeds) {
    throw new Error('Default collection not found');
  }

  return {
    collections: otherCollections || [],
    defaultCollection,
    userId: authSession.user.id
  };
}) satisfies PageServerLoad;
