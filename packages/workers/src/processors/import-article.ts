import { ArticleMetadata, ReadableArticle, Result } from '@clairvue/types';
import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';
import { ImportArticleInput } from '@clairvue/types';

export async function importArticle(
  job: Job<ImportArticleInput>
): Promise<Result<ArticleMetadata, Error>> {
  console.info(`Job ${job.id} started...`);

  const { title, url, makeReadable } = job.data;

  if (!isValidLink(url)) {
    console.warn(`[${job.id}] Invalid url found: ${url}`);
    throw new Error('Invalid url');
  }

  const existingArticleMetadataResult =
    await articleMetadataService.retrieveCachedArticleMetadata(url);

  if (existingArticleMetadataResult.isOkAnd((article) => !!article)) {
    return Result.err(new Error('Article already exists'));
  }

  console.info(`[${job.id}] Processing article ${title} from ${url}`);

  const defaultArticleMetadata: ArticleMetadata = {
    title: title ?? 'Untitled',
    link: url,
    readable: false,
    publishedAt: new Date(),
    siteName: new URL(url).hostname.replace('www.', '')
  };

  const articleResult = await httpService.fetchArticle(url);

  return articleResult.match({
    err: (error) => {
      console.warn(`[${job.id}] Error fetching article: ${url} ${error.message}`);
      return Result.err(error);
    },
    ok: async (article) => {
      const { response, mimeType } = article;

      if (!response || !isHtmlMimeType(mimeType)) {
        console.warn(`[${job.id}] Article not HTML: ${url}`);
        return Result.err(new Error('Article not HTML'));
      }

      if (!makeReadable) {
        return Result.ok(defaultArticleMetadata);
      }

      let isReadable = false;
      let readableArticle: ReadableArticle | undefined = undefined;
      const readableArticleResult = await readableArticleService.retrieveReadableArticle(
        url,
        response.clone()
      );

      await readableArticleResult.match({
        ok: async (r) => {
          if (r) {
            isReadable = true;
            readableArticle = r;
          } else {
            console.warn(`[${job.id}] Readable article not found: ${url}`);
          }
        },
        err: () => {
          console.warn(`[${job.id}] Readable article not found: ${url}`);
        }
      });

      const articleData = {
        title,
        link: url
      };
      const metadataResult = await articleMetadataService.retrieveArticleMetadata(
        response.clone(),
        articleData,
        isReadable
      );

      return metadataResult.map(
        (metadata): ArticleMetadata => ({
          ...metadata,
          title: title ?? 'Untitled',
          readable: isReadable ?? false,
          link: url,
          siteName: metadata.siteName ?? new URL(url).hostname.replace('www.', ''),
          publishedAt: metadata.publishedAt ?? new Date(),
          readableContent: readableArticle
        })
      );
    }
  });
}
