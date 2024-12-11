import { ArticleMetadata, ReadableArticle } from '@clairvue/types';
import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';

export interface ImportArticleJob {
  title: string;
  url: string;
  makeReadable: boolean;
}

export async function importArticle(
  job: Job<ImportArticleJob>
): Promise<ArticleMetadata | undefined> {
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
      ok: (metadata) => ({
        ...metadata,
        title: title ?? 'Untitled',
        readable: isReadable ?? false,
        link: url,
        siteName: metadata.siteName ?? new URL(url).hostname.replace('www.', ''),
        publishedAt: metadata.publishedAt ?? new Date()
      }),
      err: (error) => {
        console.error(`[${job.id}] Error processing article: ${error.message}`);
        throw error;
      }
    });
  }
}
