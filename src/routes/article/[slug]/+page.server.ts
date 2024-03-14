import articleRepository from '@/server/data/repositories/article.js';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '@/server/services/article.js';

export async function load({ request, params }) {
	const slug = params.slug;
	const requestHeaders = request.headers;
	const userAgent = requestHeaders.get('user-agent');

	const article = await articleRepository.findById(slug);

	if (!article) {
		return {
			status: 404,
			article: undefined,
			parsedArticle: undefined,
			error: 'Article not found'
		};
	}

	const readableArticle = await parseReadableArticle(article.link, userAgent);

	if (!readableArticle) {
		redirect(302, article.link);
	}

	return {
		status: 200,
		parsedArticle: readableArticle,
		article,
		error: undefined
	};
}
