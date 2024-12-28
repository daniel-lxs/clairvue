import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import collectionService from '@/server/services/collection.service';
import type { ArticleWithFeed, PaginatedList } from '@clairvue/types';
import articleService from '$lib/server/services/article.service';

export const load: PageServerLoad = async ({ params: { slug }, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const collectionResult = await collectionService.findBySlugWithFeeds(slug, authSession.user.id);

  if (collectionResult.isErr()) {
    error(500, collectionResult.unwrapErr().message);
  }

  const collection = collectionResult.unwrap();

  if (!collection) {
    error(404, 'Collection not found');
  }

  const limitPerPage = 20;

  const beforePublishedAt = new Date().toISOString();

  const getArticles = async (): Promise<
    PaginatedList<
      ArticleWithFeed & {
        saved: boolean;
        read: boolean;
      }
    >
  > => {
    const articlesResult = await articleService.findByCollectionIdWithInteractions(
      collection.id,
      authSession.user.id,
      beforePublishedAt,
      limitPerPage
    );

    if (articlesResult.isErr()) {
      // Streamed functions can't throw
      console.error(articlesResult.unwrapErr());
      return {
        items: [],
        totalCount: 0
      };
    }

    const articles = articlesResult.unwrap();

    if (!articles) {
      return {
        items: [],
        totalCount: 0
      };
    }

    return articles;
  };

  return {
    collection,
    streamed: {
      articles: getArticles()
    }
  };
};
