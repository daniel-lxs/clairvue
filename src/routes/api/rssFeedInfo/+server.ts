import type { RequestHandler } from '@sveltejs/kit';
import { JSDOM } from 'jsdom';

export const GET: RequestHandler = async ({ url }) => {
	const encodedRssFeedLink = url.searchParams.get('link');

	if (!encodedRssFeedLink) {
		return new Response('Missing RSS feed link', { status: 400 });
	}

	const rssFeedLink = atob(encodedRssFeedLink);

	try {
		const response = await fetch(rssFeedLink);
		const html = await response.text();

		const dom = new JSDOM(html);
		const document = dom.window.document;

		const title = document.querySelector('title')?.textContent;
		const description = document.querySelector('description')?.textContent;

		if (!title || !description) {
			return new Response('Invalid RSS feed', { status: 404 });
		}

		return new Response(JSON.stringify({ title, description }), { status: 200 });
	} catch (error) {
		console.error('Error occurred while fetching RSS feed:', error);
		return new Response('Error occurred while fetching RSS feed', { status: 500 });
	}
};
