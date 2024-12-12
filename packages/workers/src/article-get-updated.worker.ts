import { Worker, type ConnectionOptions } from 'bullmq';
import { getUpdatedArticleProcessor } from './processors/get-updated-article';

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
    duration: 60000 // 1 minute
  }
};

export function startArticleUpdatedWorker(connection: ConnectionOptions, config?: WorkerConfig) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const processors = {
    'get-updated-article': getUpdatedArticleProcessor
  };

  const worker = new Worker(
    'get-updated-article',
    async (job) => {
      const processor = processors[job.name as keyof typeof processors];
      if (!processor) {
        throw new Error(`Processor for job ${job.name} not found`);
      }
      return (await processor(job)).unwrap(); //On purpose, we want to fail the job if the processor fails
    },
    {
      connection,
      concurrency: finalConfig.concurrency,
      limiter: finalConfig.rateLimit
    }
  );

  worker.on('ready', () => {
    console.info('Get updated article worker is ready.');
  });

  worker.on('completed', async (job, result) => {
    const processingTime = Date.now() - job.timestamp;
    console.info(
      `Job ${job.id} finished in ${processingTime}ms. ` +
        `Article ${job.data.slug} ${result ? 'updated' : 'unchanged'}`
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

  return worker;
}
