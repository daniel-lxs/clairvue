import { startSyncArticlesWorker } from './articles-sync.worker';
import { startArticleUpdatedWorker } from './article-get-updated.worker';
import config from './config';
import { startArticleMetadataWorker } from './article-import.worker';

console.info('Starting workers...');
startSyncArticlesWorker(config.redis);
startArticleUpdatedWorker(config.redis);
startArticleMetadataWorker(config.redis);
console.info('Workers started.');
