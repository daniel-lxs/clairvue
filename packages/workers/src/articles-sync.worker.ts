import { Worker, type ConnectionOptions } from 'bullmq';
import type { ArticleMetadata } from '@clairvue/types';
import { syncArticlesProcessor } from './processors/sync-articles';

interface WorkerConfig {
  concurrency?: number;
  rateLimit?: {
    max: number;
    duration: number;
  };
}

const DEFAULT_CONFIG: Required<WorkerConfig> = {
  concurrency: 5,
  rateLimit: {
    max: 100,
    duration: 60000
  }
};

export function startSyncArticlesWorker(
  connection: ConnectionOptions,
  workerConfig?: WorkerConfig
) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...workerConfig
  };

  const processors = {
    syncArticles: syncArticlesProcessor
  };
  const worker = new Worker(
    'sync-articles',
    async (job) => {
      const processor = processors[job.name as keyof typeof processors];
      if (!processor) {
        throw new Error(`Processor for job ${job.name} not found`);
      }
      return processor(job);
    },
    {
      concurrency: finalConfig.concurrency,
      connection,
      limiter: finalConfig.rateLimit
    }
  );

  worker.on('ready', () => {
    console.info(`Get articles worker is ready.`);
  });

  worker.on('completed', async (job, result: ArticleMetadata[]) => {
    const processingTime = Date.now() - job.timestamp;
    console.info(
      `Job ${job.id} finished in ${processingTime}ms. ` +
        `Processed ${result.length} articles successfully.`
    );
  });

  worker.on('failed', async (job, error) => {
    const processingTime = job ? Date.now() - job.timestamp : 0;
    if (job) {
      console.error(
        `Job ${job.id} failed after ${processingTime}ms: ${error.message}`,
        '\nStack:',
        error.stack
      );
    } else {
      console.error(`A worker error occurred: ${error.message}`);
    }
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`Job ${jobId} has stalled`);
  });
}
