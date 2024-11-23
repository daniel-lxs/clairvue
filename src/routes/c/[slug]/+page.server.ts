import collectionRepository from '@/server/data/repositories/collection.repository';
import articlesRepository from '@/server/data/repositories/article.repository';
import { redirect } from '@sveltejs/kit';
import { validateAuthSession } from '@/server/services/auth.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params: { slug }, cookies }) => {
  const authSession = await validateAuthSession(cookies);

  if (!authSession) {
    redirect(302, '/auth/login');
  }

  const collection = await collectionRepository.findBySlug(authSession.user.id, slug, true);

  if (!collection) {
    throw new Error('Collection not found');
  }

  const limitPerPage = 20;
  return {
    collection,
    streamed: {
      articles: articlesRepository.findByCollectionId(collection.id, undefined, limitPerPage)
    }
  };
};
