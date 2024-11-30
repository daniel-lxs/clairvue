import { validateAuthSession } from '@/server/services/auth.service';
import type { LayoutServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import feedService from '@/server/services/feed.service';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const authSession = await validateAuthSession(cookies);

  if (authSession) {
    // Get collections and feeds
    const collections = await collectionService.findByUserId(authSession.user.id);
    const feeds = await feedService.findByUserId(authSession.user.id, 10, 0);

    return {
      collections: collections ?? [],
      feeds: feeds ?? []
    };
  }

  return {
    collections: [],
    feeds: []
  };
};
