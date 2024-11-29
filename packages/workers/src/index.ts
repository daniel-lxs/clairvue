import { startSyncArticlesWorker } from './articles-sync.worker';
import { startArticleUpdatedWorker } from './article-get-updated.worker';
import config from './config';

console.info('Starting workers...');
startSyncArticlesWorker(config.redis);
startArticleUpdatedWorker(config.redis);
console.info('Workers started.');
