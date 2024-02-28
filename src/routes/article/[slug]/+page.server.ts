import articleRepository from '$lib/data/repositories/article';
import { redirect } from '@sveltejs/kit';
import { parseReadableArticle } from '../../../lib/data/services/article.js';

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

	const domainMatch = article.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);

	const readableArticle = await parseReadableArticle(article.link, userAgent);

	if (!readableArticle) {
		redirect(302, article.link);
	}

	return {
		status: 200,
		parsedArticle: readableArticle,
		article: {
			...article,
			domain: domainMatch?.[1]
		},
		error: undefined
	};
}
