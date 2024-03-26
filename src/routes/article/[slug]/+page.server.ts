import articleRepository from '@/server/data/repositories/article';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '@/server/services/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, params }) => {
	const slug = params.slug;
	const requestHeaders = request.headers;
	const userAgent = requestHeaders.get('user-agent');

	const article = await articleRepository.findBySlug(slug);

	if (!article) {
		return {
			status: 404,
			article: undefined,
			streamed: { parsedArticle: undefined },
			error: 'Article not found'
		};
	}

	if (!article.readable) {
		redirect(302, article.link);
	}

	return {
		status: 200,
		streamed: { parsedArticle: parseReadableArticle(article.link, userAgent) },
		article,
		error: undefined
	};
};
