import { startArticleCacheWorker } from "./article-cache.worker";
import { startArticlesWorker } from "./articles-fetch-worker";

export function startWorkers() {
    // TODO: Start the workers
    // TODO: Start the workers
    startArticlesWorker();
    startArticleCacheWorker();
}