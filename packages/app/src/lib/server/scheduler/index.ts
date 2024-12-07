import { CronJob } from 'cron';
import feedRepository from '@/server/data/repositories/feed.repository';
import { getArticlesQueue, listenArticlesQueue } from '@/server/queue/articles';

export function startScheduler() {
  console.log(`[Scheduler] Started at ${new Date().toLocaleString()}`);
  const articleQueue = getArticlesQueue();
  const cronJob = new CronJob('*/2 * * * *', async () => {
    // Every 2 minutes
    console.log(`[Scheduler] Running job at ${new Date().toLocaleString()}`);
    const pageSize = 20;
    let page = 0;
    let hasMoreFeeds = true;

    while (hasMoreFeeds) {
      const feedsResult = await feedRepository.findOutdated(pageSize, page * pageSize);

      //Only outdated feeds will be synced
      if (feedsResult.isOk()) {
        const feeds = feedsResult.unwrap();
        if (!feeds) {
          console.log(`[Scheduler] No feeds to sync...`);
          hasMoreFeeds = false;
          break;
        }

        console.log(`[Scheduler] Syncing ${feeds.length} feeds...`);

        await articleQueue.addBulk(
          feeds.map((feed) => {
            return (() => {
              return {
                name: 'sync',
                data: { feed },
                opts: {
                  deduplication: {
                    id: feed.id
                  },
                  attempts: 3,
                  backoff: {
                    type: 'exponential',
                    delay: 1000
                  }
                }
              };
            })();
          })
        );

        if (feeds.length < pageSize) {
          hasMoreFeeds = false; //No more feeds
        } else {
          page++;
        }
      } else {
        const error = feedsResult.unwrapErr();
        console.error('[Scheduler] Error fetching outdated feeds:', error);
        hasMoreFeeds = false;
      }
    }
  });
  cronJob.start();
  listenArticlesQueue();
}
