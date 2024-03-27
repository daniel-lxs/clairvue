import { CronJob } from 'cron';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import type { RssFeed } from '@/server/data/schema';
import { getArticleQueue } from '../queue/articles';

export function startScheduler() {
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

				const articleQueue = getArticleQueue();

				articleQueue.addBulk(
					rssFeeds.map((rssFeed) => {
						return {
							name: 'sync',
							data: {
								rssFeedId: rssFeed.id
							},
							opts: {
								jobId: rssFeed.id,
								removeOnComplete: true
							}
						};
					})
				);
			}
			page++;
		} while (rssFeeds && rssFeeds.length > 0);
	});

	job.start();
}
