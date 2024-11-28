import { startArticleMetadataWorker } from './articles-get.worker';
import { startArticleUpdatedWorker } from './article-get-updated.worker';
import config from './config';

console.info('Starting workers...');
startArticleMetadataWorker(config.redis);
startArticleUpdatedWorker(config.redis);
console.info('Workers started.');
