import { CronJob } from 'cron';
import { syncArticles } from '../lib/data/services/article';
import rssFeedRepository from '../lib/data/repositories/rssFeed';
import type { RssFeed } from '../lib/data/schema';

console.log(`[Scheduler] Started at ${new Date().toLocaleString()}`);
const job = new CronJob('*/5 * * * *', async () => {
	// Every 5 minutes
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
