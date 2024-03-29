import { Worker, type ConnectionOptions } from 'bullmq';
import feedRepository from '@/server/data/repositories/feed';
import { syncArticles } from '@/server/services/article';
import { Logger } from '@control.systems/logger';

const logger = new Logger('Worker');

const connection: ConnectionOptions = {
	host: process.env.PRIVATE_REDIS_HOST,
	port: process.env.PRIVATE_REDIS_PORT,
	password: process.env.REDIS_PASSWORD
};

const worker = new Worker(
	'articles',
	async (job) => {
		if (job.name === 'sync') {
			logger.info(`Job ${job.id} started...`);
			const { feedId } = job.data;
			const feed = await feedRepository.findById(feedId);
			if (!feed) {
				logger.error('Feed not found');
				return;
			}
			const createdArticlesIds = await syncArticles(feed);
			return createdArticlesIds;
		}
	},
	{
		connection,
		concurrency: 5
	}
);

worker.on('completed', async (job) => {
	logger.info(`Job ${job.id} finished...`);
});

worker.on('failed', async (job) => {
	if (job) {
		logger.info(`Job ${job.id} failed: ${job.failedReason}`);
	}
	logger.info(`A unknown error occurred on worker.`);
});

logger.info('Worker started🚀');
