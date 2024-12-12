import { Feed, ArticleMetadata, Result } from '@clairvue/types';
import { Job } from 'bullmq';
import articleMetadataService from '../services/article-metadata.service';
import httpService from '../services/http.service';
import readableArticleService from '../services/readable-article.service';
import { isValidLink, isHtmlMimeType } from '../utils';

export interface GetArticlesJob {
  feed: Feed;
}

export interface JobConfig {
  chunkSize: number;
  parallelDelay: number;
}

const DEFAULT_CONFIG: JobConfig = {
  chunkSize: 10,
  parallelDelay: 1000
};

export async function syncArticlesProcessor(
  job: Job<GetArticlesJob>
): Promise<Result<ArticleMetadata[], Error>> {
  console.info(`Job ${job.id} started...`);
  const { feed } = job.data;

  if (!feed) {
    return Result.err(new Error('Feed not found'));
  }

  const rawArticlesResult = await articleMetadataService.retrieveArticlesFromFeed(feed.link);

  return rawArticlesResult.match({
    err: (error) => {
      console.error(
        `[${job.id}] Error retrieving articles from feed ${feed.name}: ${error.message}`
      );
      return Result.err(error);
    },
    ok: async (rawArticles) => {
      if (!rawArticles || rawArticles.length === 0) {
        console.info(`[${job.id}] No articles found in feed ${feed.name}.`);
        return Result.err(new Error('No articles found'));
      }

      console.info(`[${job.id}] Syncing ${rawArticles.length} articles from ${feed.name}...`);

      const articlesMetadata: ArticleMetadata[] = [];

      const chunks = Array.from(
        { length: Math.ceil(rawArticles.length / DEFAULT_CONFIG.chunkSize) },
        (_, i) =>
          rawArticles.slice(
            i * DEFAULT_CONFIG.chunkSize,
            i * DEFAULT_CONFIG.chunkSize + DEFAULT_CONFIG.chunkSize
          )
      );

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map(async (article) => {
            const { title, link } = article;

            if (!isValidLink(link)) {
              console.warn(`[${job.id}] Invalid link found: ${link}`);
              return undefined;
            }

            const existingArticleMetadataResult =
              await articleMetadataService.retrieveCachedArticleMetadata(link);

            const defaultArticle = {
              title: title ?? 'Untitled',
              link,
              readable: false,
              publishedAt: new Date(),
              siteName: new URL(link).hostname.replace('www.', '')
            };

            // If the article already exists, skip it
            return existingArticleMetadataResult.match({
              ok: (existingArticle) => (existingArticle ? undefined : processArticle(link)),
              err: () => processArticle(link)
            });

            async function processArticle(link: string): Promise<ArticleMetadata> {
              const articleResult = await httpService.fetchArticle(link);

              return articleResult.match({
                err: () => {
                  console.warn(`[${job.id}] Error fetching article: ${link}`);
                  return defaultArticle;
                },
                ok: async ({ response, mimeType }) => {
                  if (!response || !isHtmlMimeType(mimeType)) {
                    console.warn(`[${job.id}] Article not HTML: ${link}`);
                    return defaultArticle;
                  }

                  const readableArticleResult =
                    await readableArticleService.retrieveReadableArticle(link, response.clone());

                  let readable = false;

                  await readableArticleResult.match({
                    ok: async (readableArticle) => {
                      if (readableArticle) {
                        const cacheResult = await readableArticleService.createReadableArticleCache(
                          link,
                          readableArticle
                        );
                        readable = cacheResult.isOk();
                      }
                    },
                    err: () => {
                      console.warn(`[${job.id}] Readable article not found: ${link}`);
                    }
                  });

                  const metadataResult = await articleMetadataService.retrieveArticleMetadata(
                    response.clone(),
                    article,
                    readable
                  );

                  return metadataResult.match({
                    ok: (metadata) => ({
                      ...defaultArticle,
                      ...metadata
                    }),
                    err: (error) => {
                      console.error(`[${job.id}] Error processing article: ${error.message}`);
                      return defaultArticle;
                    }
                  });
                }
              });
            }
          })
        );

        articlesMetadata.push(
          ...chunkResults.filter((article): article is ArticleMetadata => Boolean(article))
        );

        await new Promise((resolve) => setTimeout(resolve, DEFAULT_CONFIG.parallelDelay));
      }

      if (!articlesMetadata || articlesMetadata.length === 0) {
        console.info(`[${job.id}] No new articles found.`);
        return Result.ok([]);
      }

      console.info(`[${job.id}] ${articlesMetadata.length} new articles found.`);
      return Result.ok(articlesMetadata);
    }
  });
}
