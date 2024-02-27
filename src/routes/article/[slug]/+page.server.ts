import { Readability, isProbablyReaderable } from '@mozilla/readability';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { URL } from 'url';
import he from 'he';
import articleRepository from '$lib/data/repositories/article';
import { redirect } from '@sveltejs/kit';

export async function load({ request, params }) {
	const articleId = params.slug;
	const headers = request.headers;
	const userAgent = headers.get('user-agent');

	const article = await articleRepository.findById(articleId);

	if (!article) {
		return {
			status: 404,
			article: undefined,
			error: 'Article not found'
		};
	}

	const domainMatch = article.link.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);

	let document: Document;
	try {
		const page = await axios.get<string>(article.link, {
			headers: {
				'User-Agent': userAgent // Set the user agent to prevent blocking
			},
			responseType: 'text'
		}); // Fetching from the test URL

		const decodedPage = he.decode(page.data);

		const dom = new JSDOM(decodedPage, {
			url: article.link
		});
		document = dom.window.document;

		// Modify image paths to absolute URLs
		const images = document.querySelectorAll('img');
		images.forEach((imgElement) => {
			const imgSrc = imgElement.getAttribute('src');
			if (imgSrc && !imgSrc.startsWith('http')) {
				// Convert relative image path to absolute URL
				const absoluteUrl = new URL(imgSrc, article.link).href;
				imgElement.setAttribute('src', absoluteUrl);
			}
		});
	} catch (error) {
		console.error(`Error occurred while fetching article: ${error}`);
		redirect(302, article.link); //TODO: temporary solution
	}

	//TODO: play with the options of Readability
	if (isProbablyReaderable(document)) {
		// Parse the modified HTML using Readability
		const readableContent = new Readability(document).parse();

		return {
			status: 200,
			article: {
				...readableContent,
				link: article.link,
				domain: domainMatch?.[1]
			},
			error: undefined
		};
	}
	redirect(302, article.link);
}
