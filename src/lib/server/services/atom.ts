import * as xml2js from 'xml2js';

interface AtomLink {
	rel: string;
	href: string;
}

interface AtomAuthor {
	name: string;
	uri: string;
}

interface AtomEntry {
	id: string;
	title: string;
	link: AtomLink;
	author: AtomAuthor;
	published: string;
	updated: string;
	metadata: { [key: string]: unknown };
}

interface AtomFeed {
	title: string;
	link: AtomLink;
	updated: string;
	entry: AtomEntry[];
}

function normalizeEntry(entry: { [key: string]: unknown }): AtomEntry {
	const normalizedEntry: AtomEntry = {
		id: entry.id as string,
		title: entry.title as string,
		link: {
			rel: (entry.link as AtomLink)?.rel || '',
			href: (entry.link as AtomLink)?.href || ''
		},
		author: {
			name: (entry.author as AtomAuthor)?.name || '',
			uri: (entry.author as AtomAuthor)?.uri || ''
		},
		published: entry.published as string,
		updated: entry.updated as string,
		metadata: {} as { [key: string]: unknown }
	};

	for (const key in entry) {
		if (
			key !== 'id' &&
			key !== 'title' &&
			key !== 'link' &&
			key !== 'author' &&
			key !== 'published' &&
			key !== 'updated'
		) {
			normalizedEntry.metadata[key] = entry[key];
			delete (normalizedEntry as unknown as { [key: string]: unknown })[key];
		}
	}

	return normalizedEntry;
}

function entryToUnknown(entry: AtomEntry): { [key: string]: unknown } {
	const { id, title, link, author, published, updated, ...metadata } = entry;

	return {
		id,
		title,
		link,
		author,
		published,
		updated,
		...metadata
	};
}

export async function parseAtomFeed(feedUrl: string): Promise<AtomFeed> {
	console.time('parseAtomFeed');
	const parser = new xml2js.Parser({ trim: true, explicitArray: false });

	try {
		const response = await fetch(feedUrl);
		if (!response.ok) {
			throw new Error(`HTTP error ${response.status}`);
		}
		const body = await response.text();

		return new Promise<AtomFeed>((resolve, reject) => {
			parser.parseString(body, (err: Error | null, result: { [key: string]: unknown }) => {
				if (err) {
					reject(err);
					return;
				}

				const feed = (result.feed as AtomFeed) || {
					title: '',
					link: { rel: '', href: '' },
					updated: '',
					entry: []
				};

				const unknownEntries = Array.from(feed.entry || [], entryToUnknown);
				const entries = Array.from(unknownEntries, normalizeEntry);
				console.timeEnd('parseAtomFeed');
				resolve({ ...feed, entry: entries });
			});
		});
	} catch (error) {
		throw new Error(`Error fetching or parsing feed: ${error}`);
	}
}
