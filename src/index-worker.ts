import { Worker, type ConnectionOptions } from 'bullmq';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
import { syncArticles } from '@/server/services/article';

const connection: ConnectionOptions = {
	host: process.env.PRIVATE_REDIS_HOST,
	port: process.env.PRIVATE_REDIS_PORT,
	password: process.env.REDIS_PASSWORD
};

const worker = new Worker(
	'articles',
	async (job) => {
		if (job.name === 'sync') {
			console.log(`Worker ${job.id} started at [${new Date().toLocaleString()}]`);
			const { rssFeedId } = job.data;
			const rssFeed = await rssFeedRepository.findById(rssFeedId);
			if (!rssFeed) {
				console.error('RSS feed not found');
				return;
			}
			const createdArticlesIds = await syncArticles(rssFeed);
			return createdArticlesIds;
		}
	},
	{
		connection,
		concurrency: 5
	}
);

worker.on('completed', async (job) => {
	console.log(`Worker ${job.id} finished at [${new Date().toLocaleString()}]`);
});

worker.on('failed', async (job) => {
	if (job) {
		console.log(`Worker ${job.id} failed: ${job.failedReason}`);
	}
	console.log(`Worker failed`);
});

console.log('Worker started🚀');
