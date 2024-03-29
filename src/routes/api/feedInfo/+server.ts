import type { RequestHandler } from '@sveltejs/kit';
import { JSDOM } from 'jsdom';

export const GET: RequestHandler = async ({ url }) => {
	const encodedFeedLink = url.searchParams.get('link');

	if (!encodedFeedLink) {
		return new Response('Missing feed link', { status: 400 });
	}

	const feedLink = atob(encodedFeedLink);

	try {
		const response = await fetch(feedLink);
		const html = await response.text();

		const dom = new JSDOM(html);
		const document = dom.window.document;

		const title = document.querySelector('title')?.textContent;
		const description = document.querySelector('description')?.textContent;

		if (!title || !description) {
			return new Response('Invalid  feed', { status: 404 });
		}

		return new Response(JSON.stringify({ title, description }), { status: 200 });
	} catch (error) {
		console.error('Error occurred while fetching feed:', error);
		return new Response('Error occurred while fetching  feed', { status: 500 });
	}
};
