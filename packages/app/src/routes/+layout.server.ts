import type { LayoutServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import feedService from '@/server/services/feed.service';
import authService from '@/server/services/auth.service';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    ok: async (authSession) => {
      if (authSession) {
        // Get collections and feeds
        const collectionsResult = await collectionService.findByUserId(authSession.user.id);
        const feedsResult = await feedService.findByUserId(authSession.user.id, 10, 0);

        if (collectionsResult.isErr()) {
          error(500, collectionsResult.unwrapErr().message);
        }

        if (feedsResult.isErr()) {
          error(500, feedsResult.unwrapErr().message);
        }

        return {
          collections: collectionsResult.unwrap() || [],
          feeds: feedsResult.unwrap() || []
        };
      }

      return {
        collections: [],
        feeds: []
      };
    },
    err: (e) => {
      error(500, e.message);
    }
  });
};
