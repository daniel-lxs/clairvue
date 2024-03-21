import type { CreateRssFeedDto } from '@/server/dto/rssFeedDto';
import type { CreateRssFeedResult } from '@/types/CreateRssFeedResult';
import type { RssFeed } from '@/server/data/schema';

export async function createRssFeeds(
	rssFeeds: CreateRssFeedDto[],
	boardId: string
): Promise<CreateRssFeedResult[]> {
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

		const results: CreateRssFeedResult[] = await response.json();
		if (results.length !== rssFeeds.length) {
			throw new Error('Failed to create all RSS feeds');
		}

		const assignments: { id: string; rssFeedId: string }[] = results
			.map((r) => {
				if (r.result === 'error') {
					return undefined;
				}

				return {
					id: boardId,
					rssFeedId: r.data?.id
				};
			})
			.filter(Boolean) as { id: string; rssFeedId: string }[];

		if (assignments.length > 0) {
			await addFeedToBoard(assignments);
		}

		return results;
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

export async function getRssFeed(id: string): Promise<RssFeed | undefined> {
	try {
		const response = await fetch(`/api/rssFeed?id=${id}`);
		if (!response.ok) {
			throw new Error(`Failed to get RSS feed: ${response.statusText}`);
		}
		return await response.json();
	} catch (error) {
		console.error('Error occurred while getting RSS feed:', error);
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

export async function addFeedToBoard(assignments: { id: string; rssFeedId: string }[]) {
	try {
		const response = await fetch('/api/board', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(assignments)
		});
		if (!response.ok) {
			console.error(`Failed to add RSS feed: ${response.statusText}`);
			throw new Error('Failed to add RSS feed');
		}
	} catch (error) {
		console.error('Error occurred while adding RSS feed:', error);
		throw error;
	}
}
