// src/routes/blog/index.server.ts
import { Readability } from '@mozilla/readability';
import axios, { AxiosError } from 'axios';
import jsdom from 'jsdom';

export async function load() {
	const url = 'https://antithesis.com/blog/is_something_bugging_you/';
	const domainMatch = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);

	try {
		const { JSDOM } = jsdom;
		const page = await axios.get(url); // Fetching from the test URL

		const doc = new JSDOM(page.data);
		const article = new Readability(doc.window.document).parse();

		return {
			post: {
				...article,
				url: domainMatch?.[1] // Extract domain only
			}
		};
	} catch (error) {
		return {
			status: (error as AxiosError).response?.status || 500,
			error: new Error('Error fetching page data')
		};
	}
}
