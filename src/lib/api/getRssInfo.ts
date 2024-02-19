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
