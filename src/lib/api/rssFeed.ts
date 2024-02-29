import type { CreateRssFeedDto } from '@/server/dto/rssFeedDto';
import type { CreateRssFeedResult } from '@/types/CreateRssFeedResult';

export async function createRssFeeds(rssFeeds: CreateRssFeedDto[]): Promise<CreateRssFeedResult[]> {
	try {
		const response = await fetch('/api/rssFeed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(rssFeeds)
		});
		if (response.status === 400) {
			throw new Error(`Invalid RSS feed: ${response.statusText}`);
		}

		if (!response.ok) {
			throw new Error(`Failed to create RSS feeds: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error occurred while creating RSS feeds:', error);
		throw error;
	}
}

export async function getRssInfo(
	rssLink: string
): Promise<{ title: string; description: string } | undefined> {
	try {
		const response = await fetch(`/api/rssFeedInfo?link=${btoa(rssLink)}`);
		if (!response.ok) {
			console.error('Error fetching RSS info:', response.statusText);
			return undefined;
		}
		return await response.json();
	} catch (error) {
		console.error('Error fetching RSS info:', error);
		return undefined;
	}
}

export async function updateRssFeed(
	id: string,
	name: string,
	description: string,
	link: string,
	boardId: string
) {
	try {
		const response = await fetch('/api/rssFeed', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: id,
				name: name,
				description: description,
				link: link,
				boardId
			})
		});
		if (response.status === 400) {
			console.error(`Invalid RSS feed: ${response.statusText}`);
			throw new Error('Invalid RSS feed');
		}

		if (!response.ok) {
			console.error(`Failed to update RSS feed: ${response.statusText}`);
			throw new Error('Failed to update RSS feed');
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error occurred while updating RSS feed:', error);
		throw error;
	}
}
