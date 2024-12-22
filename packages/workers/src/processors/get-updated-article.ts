import { Job } from 'bullmq';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';
import { ReadableArticle, Result, RefreshArticleContentInput } from '@clairvue/types';

export async function getUpdatedArticleProcessor(
  job: Job<RefreshArticleContentInput>
): Promise<Result<ReadableArticle | false, Error>> {
  const { slug, url } = job.data;

  if (!isValidLink(url)) {
    console.warn(`[${job.id}] Invalid link found: ${url}`);
    return Result.err(new Error('Invalid link'));
  }

  const articleResponseResult = await httpService.fetchArticle(url);

  return articleResponseResult.match({
    err: (error) => {
      console.error(`[${job.id}] Error fetching article: ${error.message}`);
      return Result.err(error);
    },
    ok: async (articleResponse) => {
      if (!articleResponse || !isHtmlMimeType(articleResponse.mimeType)) {
        console.warn(`[${job.id}] Invalid response or content type for ${url}`);
        return Result.err(new Error('Invalid response'));
      }

      const { response } = articleResponse;

      console.info(`[${job.id}] Updating article ${slug} from ${url}`);

      const readableArticleResult = await readableArticleService.retrieveReadableArticle(
        url,
        response
      );

      return readableArticleResult.match({
        ok: (readableArticle) => {
          if (!readableArticle) {
            console.warn(`[${job.id}] No updated content found for article ${slug}`);
            return Result.ok(false);
          }
          return Result.ok(readableArticle);
        },
        err: (error) => {
          console.error(`[${job.id}] Error updating article: ${error.message}`);
          return Result.err(error);
        }
      });
    }
  });
}
