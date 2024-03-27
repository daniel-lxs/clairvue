import { Worker, type ConnectionOptions } from 'bullmq';
import rssFeedRepository from '@/server/data/repositories/rssFeed';
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
			const { rssFeedId } = job.data;
			const rssFeed = await rssFeedRepository.findById(rssFeedId);
			if (!rssFeed) {
				logger.error('RSS feed not found');
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
	logger.info(`Job ${job.id} finished...`);
});

worker.on('failed', async (job) => {
	if (job) {
		logger.info(`Job ${job.id} failed: ${job.failedReason}`);
	}
	logger.info(`A unknown error occurred on worker.`);
});

logger.info('Worker started🚀');
