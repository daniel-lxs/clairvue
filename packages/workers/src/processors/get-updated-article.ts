import { Job } from 'bullmq';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';
import { ReadableArticle } from '@clairvue/types';

export interface GetUpdatedArticleJob {
  slug: string;
  url: string;
}

export async function getUpdatedArticleProcessor(
  job: Job<GetUpdatedArticleJob>
): Promise<ReadableArticle | undefined> {
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

  const updatedArticleResult = await readableArticleService.refreshReadableArticle(url, response);

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
}
