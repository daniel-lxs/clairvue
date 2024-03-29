import { CronJob } from 'cron';
import feedRepository from '@/server/data/repositories/feed';
import type { Feed } from '@/server/data/schema';
import { getArticleQueue } from '../queue/articles';

export function startScheduler() {
	console.log(`[Scheduler] Started at ${new Date().toLocaleString()}`);
	const job = new CronJob('*/10 * * * *', async () => {
		// Every 2 minutes
		console.log(`[Scheduler] Running job at ${new Date().toLocaleString()}`);

		let page = 1;
		const pageSize = 20;

		let feeds: Feed[] | undefined;
		do {
			feeds = await feedRepository.findAll(pageSize, (page - 1) * pageSize);

			if (feeds.length > 0) {
				console.log(`[Scheduler] Syncing ${feeds.length} feeds...`);

				const articleQueue = getArticleQueue();

				articleQueue.addBulk(
					feeds.map((feed) => {
						return {
							name: 'sync',
							data: {
								feedId: feed.id
							},
							opts: {
								jobId: feed.id,
								removeOnComplete: true
							}
						};
					})
				);
			}
			page++;
		} while (feeds && feeds.length > 0);
	});

	job.start();
}
