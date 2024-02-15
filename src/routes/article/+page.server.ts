import { Readability } from '@mozilla/readability';
import axios, { isAxiosError } from 'axios';
import { JSDOM } from 'jsdom';
import { URL } from 'url'; // Import URL module for working with URLs

export async function load({ request }) {
	const headers = request.headers;
	const userAgent = headers.get('user-agent');

	const url = 'https://lineageos.org/Changelog-28/';
	const domainMatch = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)\//i);

	try {
		const page = await axios.get(url, {
			headers: {
				'User-Agent': userAgent // Set the user agent to prevent blocking
			}
		}); // Fetching from the test URL

		const dom = new JSDOM(page.data);
		const document = dom.window.document;

		// Modify image paths to absolute URLs
		const images = document.querySelectorAll('img');
		images.forEach((imgElement) => {
			const imgSrc = imgElement.getAttribute('src');
			if (imgSrc && !imgSrc.startsWith('http')) {
				// Convert relative image path to absolute URL
				const absoluteUrl = new URL(imgSrc, url).href;
				imgElement.setAttribute('src', absoluteUrl);
			}
		});

		// Parse the modified HTML using Readability
		const article = new Readability(document).parse();

		return {
			post: {
				...article,
				url,
				domain: domainMatch?.[1]
			}
		};
	} catch (error) {
		console.error(error);
		return {
			status: isAxiosError(error) ? error.response?.status : 500,
			error: isAxiosError(error) ? error.response?.data : error
		};
	}
}
