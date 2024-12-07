import { Worker, type ConnectionOptions } from 'bullmq';
import readableArticleService from './services/readable-article.service';
import httpService from './services/http.service';
import { isHtmlMimeType, isValidLink } from './utils';

interface GetUpdatedArticleJob {
  slug: string;
  url: string;
}

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

  const worker = new Worker<GetUpdatedArticleJob>(
    'get-updated-article',
    async (job) => {
      const { slug, url } = job.data;

      if (!isValidLink(url)) {
        console.warn(`[${job.id}] Invalid link found: ${url}`);
        throw new Error('Invalid link');
      }

      const articleResponseResult = await httpService.fetchArticle(url);

      if (articleResponseResult.isErr()) {
        console.error(
          `[${job.id}] Error fetching article: ${articleResponseResult.unwrapErr().message}`
        );
        throw articleResponseResult.unwrapErr();
      }

      if (
        articleResponseResult.isOkAnd(
          (articleResponse) => !articleResponse || !isHtmlMimeType(articleResponse.mimeType)
        )
      ) {
        console.warn(`[${job.id}] Invalid response or content type for ${url}`);
        throw new Error('Invalid response');
      }

      const { response } = articleResponseResult.unwrap();

      console.info(`[${job.id}] Updating article ${slug} from ${url}`);

      const updatedArticleResult = await readableArticleService.refreshReadableArticle(
        url,
        response
      );

      return updatedArticleResult.match({
        ok: async (readableArticle) => {
          if (!readableArticle) {
            console.warn(`[${job.id}] No updated content found for article ${slug}`);
            return undefined;
          }

          return readableArticle;
        },
        err: (error) => {
          console.error(`[${job.id}] Error updating article: ${error.message}`);
          throw error;
        }
      });
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
