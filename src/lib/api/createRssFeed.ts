export async function createRssFeed(
	name: string,
	description: string,
	link: string,
	boardId: string
) {
	try {
		const response = await fetch('/api/rssFeed', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: name,
				description: description,
				link: link,
				boardId
			})
		});
		if (response.status === 400) {
			throw new Error(`Invalid RSS feed: ${response.statusText}`);
		}

		if (!response.ok) {
			throw new Error(`Failed to create RSS feed: ${response.statusText}`);
		}
	} catch (error) {
		console.error('Error occurred while creating RSS feed:', error);
		throw error;
	}
}
