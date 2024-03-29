import type { RequestHandler } from '@sveltejs/kit';
import Parser from 'rss-parser';

export const GET: RequestHandler = async ({ url }) => {
	const encodedFeedLink = url.searchParams.get('link');

	if (!encodedFeedLink) {
		return new Response('Missing feed link', { status: 400 });
	}

	const feedLink = atob(encodedFeedLink);

	try {
		const response = await fetch(feedLink);

		if (!response.ok) {
			return new Response('Could not fetch feed', { status: 404 });
		}

		const feedData = await response.text();
		const parsedData = await new Parser().parseString(feedData);

		if (!parsedData) {
			return new Response('Could not parse feed', { status: 404 });
		}

		const { title, description } = parsedData;

		if (!title) {
			return new Response('Invalid feed', { status: 404 });
		}

		return new Response(JSON.stringify({ title, description }), { status: 200 });
	} catch (error) {
		console.error('Error occurred while fetching feed:', error);
		return new Response('Error occurred while fetching feed', { status: 500 });
	}
};
