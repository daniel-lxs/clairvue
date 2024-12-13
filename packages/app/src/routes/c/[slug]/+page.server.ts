import { redirect, error } from '@sveltejs/kit';
import authService from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import type { ArticleWithFeed, PaginatedList, FeedWithArticles } from '@clairvue/types';
import feedService from '$lib/server/services/feed.service';

export const load: PageServerLoad = async ({ params: { slug }, cookies }) => {
  const authSessionResult = await authService.validateAuthSession(cookies);

  return authSessionResult.match({
    err: (e) => {
      error(500, e.message);
    },
    ok: async (authSession) => {
      if (!authSession) {
        redirect(302, '/auth/login');
      }

      const collectionResult = await collectionService.findBySlugWithFeeds(
        slug,
        authSession.user.id
      );

      if (collectionResult.isErr()) {
        error(500, collectionResult.unwrapErr().message);
      }

      const collection = collectionResult.unwrap();

      if (!collection) {
        error(404, 'Collection not found');
      }

      const limitPerPage = 20;

      const beforePublishedAt = new Date();

      const getArticles = async (): Promise<
        PaginatedList<
          ArticleWithFeed & {
            saved: boolean;
            read: boolean;
          }
        >
      > => {
        const feedsResult = await feedService.findByCollectionIdWithArticles(
          collection.id,
          beforePublishedAt,
          limitPerPage
        );

        if (feedsResult.isErr()) {
          error(500, feedsResult.unwrapErr().message);
        }

        const feeds: FeedWithArticles[] | false = feedsResult.unwrap();

        if (!feeds) {
          error(404, 'Feeds not found');
        }

        const articles: (ArticleWithFeed & {
          saved: boolean;
          read: boolean;
        })[] = feeds.flatMap((feed) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { articles: _, ...feedWithoutArticles } = feed;

          return feed.articles.map((article) => ({
            ...article,
            feed: feedWithoutArticles
          }));
        });

        return {
          items: articles,
          totalCount: articles.length
        };
      };

      return {
        collection,
        streamed: {
          articles: getArticles()
        }
      };
    }
  });
};
