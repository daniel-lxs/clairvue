import { Worker, type ConnectionOptions } from 'bullmq';
import { importArticle } from './processors/import-article';
import { getArticleMetadata } from './processors/get-article-metadata';

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

export function startArticleMetadataWorker(connection: ConnectionOptions, config?: WorkerConfig) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const jobProcessors = {
    'import-article': importArticle,
    'get-article-metadata': getArticleMetadata
  };

  const worker = new Worker(
    'article-metadata',
    async (job) => {
      const processor = jobProcessors[job.name as keyof typeof jobProcessors];
      if (!processor) {
        throw new Error(`Unknown job type: ${job.name}`);
      }
      return processor(job);
    },
    {
      ...finalConfig,
      connection
    }
  );

  worker.on('ready', () => {
    console.info(`Article metadata worker is ready`);
  });

  worker.on('completed', async (job) => {
    const processingTime = Date.now() - job.timestamp;
    console.info(
      `Job ${job.id} finished in ${processingTime}ms. ` + `Processed 1 article successfully.`
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
