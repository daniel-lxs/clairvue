import { CronJob } from 'cron';
import { syncArticles } from '../lib/server/data/services/article';
import rssFeedRepository from '../lib/server/data/repositories/rssFeed';
import type { RssFeed } from '../lib/server/data/schema';

console.log(`[Scheduler] Started at ${new Date().toLocaleString()}`);
const job = new CronJob('*/10 * * * *', async () => {
	// Every 2 minutes
	console.log(`[Scheduler] Running job at ${new Date().toLocaleString()}`);

	let page = 1;
	const pageSize = 20;

	let rssFeeds: RssFeed[] | undefined;
	do {
		rssFeeds = await rssFeedRepository.findAll(pageSize, (page - 1) * pageSize);

		if (rssFeeds.length > 0) {
			console.log(`[Scheduler] Syncing ${rssFeeds.length} RSS feeds...`);
			await Promise.all(
				rssFeeds.map(async (rssFeed) => {
					await syncArticles(rssFeed, false);
				})
			);
		}
		page++;
	} while (rssFeeds && rssFeeds.length > 0);
});

job.start();
