import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import articlesService from '@/server/services/article.service';
import type { ArticleWithInteraction } from '@clairvue/types';
export const load: PageServerLoad = async ({ locals, url }) => {
  const { authSession } = locals;

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const take = Number(url.searchParams.get('take') ?? '20');
  const skip = Number(url.searchParams.get('skip') ?? '0');

  const getArticles = async () => {
    const articlesResult = await articlesService.findSavedByUserId(authSession.user.id, take, skip);

    if (articlesResult.isErr()) {
      error(500, articlesResult.unwrapErr().message);
    }

    if (articlesResult.isOkAnd((articles) => articles === false)) {
      return [];
    }

    const articles = articlesResult.unwrap() as ArticleWithInteraction[];

    return articles;
  };

  return {
    streamed: {
      articles: getArticles()
    }
  };
};
