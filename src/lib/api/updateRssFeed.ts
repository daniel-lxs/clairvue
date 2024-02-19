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
