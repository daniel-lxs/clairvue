import { CronJob } from 'cron';
import feedRepository from '@/server/data/repositories/feed';
import { getArticleQueue } from '@/server/queue/articles';

export function startScheduler() {
  console.log(`[Scheduler] Started at ${new Date().toLocaleString()}`);
  const job = new CronJob('*/2 * * * *', async () => {
    // Every 2 minutes
    console.log(`[Scheduler] Running job at ${new Date().toLocaleString()}`);
    const pageSize = 20;
    let page = 0;
    let hasMoreFeeds = true;

    while (hasMoreFeeds) {
      try {
        const feeds = await feedRepository.findOutdated(pageSize, page * pageSize);

        //Only outdated feeds will be synced
        if (feeds.length === 0) {
          console.log(`[Scheduler] No feeds to sync...`);
          hasMoreFeeds = false;
          break;
        }

        console.log(`[Scheduler] Syncing ${feeds.length} feeds...`);
        const articleQueue = getArticleQueue();
        articleQueue?.addBulk(
          feeds.map((feed) => {
            return (() => {
              const feedId = feed.id;
              return {
                name: 'sync',
                data: { feedId },
                opts: { jobId: feedId, removeOnComplete: true, removeOnFail: true }
              };
            })();
          })
        );

        if (feeds.length < pageSize) {
          hasMoreFeeds = false; //No more feeds
        } else {
          page++;
        }
      } catch (error) {
        console.error('[Scheduler] Error fetching outdated feeds:', error);
        hasMoreFeeds = false;
      }
    }
  });

  job.start();
}
