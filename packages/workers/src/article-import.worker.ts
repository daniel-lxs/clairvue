import { Worker, type ConnectionOptions } from 'bullmq';
import { isHtmlMimeType, isValidLink } from './utils';
import articleMetadataService from './services/article-metadata.service';
import httpService from './services/http.service';
import { ReadableArticle } from '@clairvue/types';
import readableArticleService from './services/readable-article.service';

interface ArticleMetadataJob {
  title: string;
  url: string;
  makeReadable: boolean;
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
    duration: 60000
  }
};

export function startArticleMetadataWorker(connection: ConnectionOptions, config?: WorkerConfig) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  const worker = new Worker<ArticleMetadataJob>(
    'article-metadata',
    async (job) => {
      console.info(`Job ${job.id} started...`);

      const { title, url, makeReadable } = job.data;

      if (!isValidLink(url)) {
        console.warn(`[${job.id}] Invalid url found: ${url}`);
        throw new Error('Invalid url');
      }

      console.info(`[${job.id}] Processing article ${title} from ${url}`);

      const articleResult = await httpService.fetchArticle(url);

      if (articleResult.isErr()) {
        console.warn(`[${job.id}] Error fetching article: ${url}`);
        return {
          title: title ?? 'Untitled',
          link: url,
          readable: false,
          publishedAt: new Date(),
          siteName: new URL(url).hostname.replace('www.', '')
        };
      }

      const { response, mimeType } = articleResult.unwrap();

      if (!response || !isHtmlMimeType(mimeType)) {
        console.warn(`[${job.id}] Article not HTML: ${url}`);
        return {
          title: title ?? 'Untitled',
          link: url,
          readable: false,
          publishedAt: new Date(),
          siteName: new URL(url).hostname.replace('www.', '')
        };
      }
      let isReadable = false;
      if (makeReadable) {
        const readableArticleResult = await readableArticleService.retrieveReadableArticle(
          url,
          response.clone()
        );

        if (readableArticleResult.isOkAnd((readableArticle) => !!readableArticle)) {
          await readableArticleService.createReadableArticleCache(
            url,
            readableArticleResult.unwrap() as ReadableArticle
          );
          isReadable = true;
        } else {
          console.warn(`[${job.id}] Readable article not found: ${url}`);
        }

        const articleData = {
          title,
          link: url
        };
        const metadataResult = await articleMetadataService.retrieveArticleMetadata(
          response.clone(),
          articleData,
          isReadable
        );

        return metadataResult.match({
          ok: (metadata) => metadata,
          err: (error) => {
            console.error(`[${job.id}] Error processing article: ${error.message}`);
            throw error;
          }
        });
      }
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
