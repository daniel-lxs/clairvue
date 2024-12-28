import { ArticleMetadata, Result, ExtractArticleMetadataInput } from '@clairvue/types';
import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import { isValidLink, isHtmlMimeType } from '../utils';
import readableService from '../services/readable-article.service';

export async function getArticleMetadata(
  job: Job<ExtractArticleMetadataInput>
): Promise<Result<ArticleMetadata, Error>> {
  console.info(`Job ${job.id} started...`);

  const { url } = job.data;

  if (!isValidLink(url)) {
    console.warn(`[${job.id}] Invalid url found: ${url}`);
    throw new Error('Invalid url');
  }

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
        throw new Error('Article not HTML');
      }

      const isReadableResult = await readableService.isReadable(url, response.clone());

      return isReadableResult.match({
        err: (error) => {
          console.warn(
            `[${job.id}] Error checking if article is readable: ${url} ${error.message}`
          );
          return Result.err(error);
        },

        ok: async (isReadable) => {
          const articleData = {
            link: url
          };
          const metadataResult = await articleMetadataService.retrieveArticleMetadata(
            response.clone(),
            articleData
          );

          return metadataResult.match({
            ok: (metadata) => {
              return Result.ok({
                ...metadata,
                title: metadata.title ?? 'Untitled',
                readable: isReadable,
                link: url,
                siteName: metadata.siteName ?? new URL(url).hostname.replace('www.', ''),
                publishedAt: metadata.publishedAt ?? new Date()
              });
            },
            err: (error) => {
              console.error(`[${job.id}] Error processing article: ${error.message}`);
              return Result.err(error);
            }
          });
        }
      });
    }
  });
}
