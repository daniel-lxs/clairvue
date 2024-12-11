import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import { isValidLink, isHtmlMimeType } from '../utils';
import { ArticleMetadata } from '@clairvue/types';
import readableService from '../services/readable-article.service';
export interface GetArticleMetadataJob {
  url: string;
}

export async function getArticleMetadata(
  job: Job<GetArticleMetadataJob>
): Promise<ArticleMetadata | undefined> {
  console.info(`Job ${job.id} started...`);

  const { url } = job.data;

  if (!isValidLink(url)) {
    console.warn(`[${job.id}] Invalid url found: ${url}`);
    throw new Error('Invalid url');
  }

  const articleResult = await httpService.fetchArticle(url);

  if (articleResult.isErr()) {
    console.warn(`[${job.id}] Error fetching article: ${url}`);
    throw new Error('Error fetching article');
  }

  const { response, mimeType } = articleResult.unwrap();

  if (!response || !isHtmlMimeType(mimeType)) {
    console.warn(`[${job.id}] Article not HTML: ${url}`);
    throw new Error('Article not HTML');
  }

  const isReadableResult = await readableService.isReadable(url, response.clone());

  if (isReadableResult.isErr()) {
    console.warn(
      `[${job.id}] Something went wrong while checking if the article is readable: ${url}`
    );
    throw new Error(
      `Error checking if article is readable: ${isReadableResult.unwrapErr().message}`
    );
  }

  const articleData = {
    link: url
  };
  const metadataResult = await articleMetadataService.retrieveArticleMetadata(
    response.clone(),
    articleData
  );
  return metadataResult.match({
    ok: (metadata) => ({
      ...metadata,
      title: metadata.title ?? 'Untitled',
      readable: isReadableResult.unwrap(),
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
