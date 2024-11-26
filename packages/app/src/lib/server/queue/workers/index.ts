import { startArticleCacheWorker } from './article-cache.worker';
import { startArticlesWorker } from './articles-fetch.worker';

export function startWorkers() {
  startArticlesWorker();
  startArticleCacheWorker();
}
