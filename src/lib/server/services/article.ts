import { isProbablyReaderable, Readability } from '@mozilla/readability';
import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import urlMetadata from 'url-metadata';
import Parser from 'rss-parser';
import articleRepository from '@/server/data/repositories/article';
import feedRepository from '@/server/data/repositories/feed';
import type { Feed } from '@/server/data/schema';
import type { ParsedArticle } from '@/types/ParsedArticle';
import { z } from 'zod';
import type { ArticleMetadata } from '@/types/ArticleMetadata';
import type { NewArticle } from '@/types/NewArticle';

interface ProcessArticlesOptions {
  chunkSize?: number;
  parallelDelay?: number;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36';

async function parseFeed(url: string): Promise<Parser.Output<Parser.Item> | undefined> {
  const parser = new Parser({
    timeout: 10000, // 10 seconds
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  try {
    const feed = await parser.parseURL(url);
    return feed;
  } catch (error) {
    console.error(
      `Feed with url: ${url} could not be parsed, trying to find RSS or Atom feed link`,
      error
    );

    // Check for RSS or Atom feed links
    const response = await fetch(url);
    const html = await response.text();

    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['head', 'link'],
      ALLOWED_ATTR: ['href', 'rel', 'type'],
      WHOLE_DOCUMENT: true
    });

    const { document } = new JSDOM(cleanHtml).window;

    const rssLink = document.querySelector('link[rel="alternate"][type="application/rss+xml"]');
    const atomLink = document.querySelector('link[rel="alternate"][type="application/atom+xml"]');

    if (rssLink) {
      let rssUrl = rssLink.getAttribute('href');
      if (rssUrl && !rssUrl.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        rssUrl = new URL(rssUrl, baseUrl).href;
      }
      if (!rssUrl) {
        throw new Error('No RSS feed found');
      }
      return parseFeed(rssUrl);
    } else if (atomLink) {
      let atomUrl = atomLink.getAttribute('href');
      if (atomUrl && !atomUrl.startsWith('http')) {
        const baseUrl = new URL(url).origin;
        atomUrl = new URL(atomUrl, baseUrl).href;
      }
      if (!atomUrl) {
        throw new Error('No Atom feed found');
      }
      return parseFeed(atomUrl);
    } else {
      throw new Error('No valid feed found');
    }
  }
}

export async function fetchFeedArticles(link: string) {
  try {
    const feed = await parseFeed(link);

    if (!feed || !feed.items || feed.items.length === 0) {
      throw new Error('No feed items found');
    }

    feed.items.sort((a, b) => {
      if (a.pubDate && b.pubDate) {
        return new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf();
      } else {
        return 0; // Or handle the case where pubDate is undefined
      }
    });

    return feed.items;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error occurred while fetching feed articles:', error.message);
    } else {
      console.error(`Unknown error occurred while fetching feed articles ${error}`);
    }
    return undefined;
  }
}

export async function syncArticles(feed: Feed, jobContext: string = 'None') {
  try {
    const orderedArticles = await fetchFeedArticles(feed.link);

    if (!orderedArticles) return;

    console.info(`[${jobContext}] Syncing ${orderedArticles.length} articles from ${feed.name}...`);

    await feedRepository.updateLastSync(feed.id);

    const newArticles = await processArticles(feed, orderedArticles);

    if (!newArticles || newArticles.length === 0) {
      console.info(`[${jobContext}] No new articles found.`);
      return;
    }

    const createdArticles = await saveArticles(newArticles);

    if (!createdArticles) {
      console.info(`[${jobContext}] No new articles created.`);
      return;
    }

    console.info(`[${jobContext}] Synced ${createdArticles.length} articles.`);
    return createdArticles;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[${jobContext}] Error occurred while fetching feed articles:`, error.message);
    } else {
      console.error(`[${jobContext}] Unknown error occurred while fetching feed articles ${error}`);
    }
  }
}

async function getMimeType(url: string, ua: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': ua } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const mimeType = response.headers.get('content-type');
    return mimeType ?? undefined;
  } catch (error) {
    console.error('Error fetching MIME type:', error);
    return undefined;
  }
}

async function fetchArticleMetadata(link: string): Promise<ArticleMetadata | undefined> {
  try {
    const ua = USER_AGENT;

    const mimeType = await getMimeType(link, ua);
    if (!mimeType || !mimeType.startsWith('text/html')) {
      console.error(`File with link ${link} is not an HTML file or could not be fetched`);
      return undefined;
    }

    const isReadablePromise = isArticleReadable(link, ua);

    const metadata = await urlMetadata(link, {
      timeout: 10000,
      requestHeaders: {
        'User-Agent': ua
      }
    });

    // Wait for readability check with a timeout
    const readable = await Promise.race([
      isReadablePromise,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 15000))
    ]);

    const articleMetadata = extractArticleMetadata(metadata, new URL(link).hostname);

    if (!articleMetadata) {
      return undefined;
    }

    return {
      ...articleMetadata,
      readable
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Error occurred while fetching metadata for article with link ${link}:`,
        error.message
      );
    } else {
      console.error('Error occurred while fetching metadata');
    }
    return undefined;
  }
}

async function createNewArticle(feed: Feed, article: Parser.Item): Promise<NewArticle | undefined> {
  const { link, title } = article;
  const pubDate = article.pubDate ?? article.isoDate;

  if (!link) return;
  if (!z.string().url().safeParse(link).success) return;

  try {
    const existingArticle = await articleRepository.existsWithLink(link);
    if (existingArticle) return;

    console.info(`Processing article: ${link}`);

    const articleMetadata = await fetchArticleMetadata(link);

    if (articleMetadata) {
      const newArticle: NewArticle = {
        feedId: feed.id,
        link,
        siteName: new URL(link).hostname.replace('www.', ''),
        title: title ?? articleMetadata.title ?? 'Untitled',
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        readable: articleMetadata.readable,
        image: articleMetadata.image ?? null,
        author: articleMetadata.author ?? null,
        description: articleMetadata.description ?? null
      };
      return newArticle;
    }

    const newArticle: NewArticle = {
      feedId: feed.id,
      link,
      siteName: new URL(link).hostname.replace('www.', ''),
      title: title ?? 'Untitled',
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      readable: false,
      image: null,
      author: null,
      description: null
    };

    return newArticle;
  } catch (error) {
    console.error(`Error processing article ${link}:`, error);
    return;
  }
}

async function processArticles(
  feed: Feed,
  articles: Parser.Item[],
  options: ProcessArticlesOptions = {}
): Promise<NewArticle[]> {
  const { chunkSize = 10, parallelDelay = 1000 } = options;
  const newArticles: NewArticle[] = [];

  const chunks = Array.from({ length: Math.ceil(articles.length / chunkSize) }, (_, i) =>
    articles.slice(i * chunkSize, i * chunkSize + chunkSize)
  );

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map((article) => createNewArticle(feed, article)));
    newArticles.push(...chunkResults.filter((article): article is NewArticle => !!article));
    await new Promise((resolve) => setTimeout(resolve, parallelDelay));
  }

  return newArticles;
}

async function saveArticles(newArticles: NewArticle[]): Promise<string[] | undefined> {
  const createdIds = await articleRepository.create(newArticles);
  return createdIds;
}

async function fetchAndCleanDocument(
  link: string,
  ua?: string | null
): Promise<Document | undefined> {
  const userAgent = ua || USER_AGENT;
  const timeout = 20000; // 20 seconds

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Timeout reached while fetching article with link ${link}`);
    }, timeout);

    const pageResponse = await fetch(link, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!pageResponse.ok) {
      console.error(
        `Error occurred while fetching article with link ${link}: ${pageResponse.statusText}`
      );
      return undefined;
    }

    const html = await pageResponse.text();
    const cleanHtml = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
      FORBID_ATTR: ['style', 'class']
    });
    const dom = new JSDOM(cleanHtml, { url: link });
    return dom.window.document;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`Timeout reached while fetching article with link ${link}`);
      } else {
        console.error(`Error occurred while fetching article: ${error}`);
      }
    } else {
      console.error(`Unknown error occurred while fetching article ${error}`);
    }
    return undefined;
  }
}

export async function parseReadableArticle(
  link: string,
  ua?: string | null
): Promise<ParsedArticle | undefined> {
  const document = await fetchAndCleanDocument(link, ua);

  if (!document) {
    return undefined;
  }

  if (isProbablyReaderable(document)) {
    // Modify image paths to absolute URLs
    const images = document.querySelectorAll('img');
    images.forEach((imgElement) => {
      const imgSrc = imgElement.getAttribute('src');
      if (imgSrc && !imgSrc.startsWith('http')) {
        // Convert relative image path to absolute URL
        const absoluteUrl = new URL(imgSrc, link).href;
        imgElement.setAttribute('src', absoluteUrl);
      }
    });

    // Parse the modified HTML using Readability
    const readableArticle = new Readability(document).parse();
    if (!readableArticle) {
      console.error('Error occurred while parsing article');
      return undefined;
    }

    return readableArticle;
  }

  return undefined;
}

export async function isArticleReadable(link: string, ua?: string | null): Promise<boolean> {
  const document = await fetchAndCleanDocument(link, ua);

  if (!document) {
    return false;
  }

  return isProbablyReaderable(document);
}

function extractArticleMetadata(
  metadata: urlMetadata.Result | undefined,
  domain: string
): ArticleMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const title = ((metadata: urlMetadata.Result): string | undefined => {
    const title =
      metadata.title ||
      metadata['og:title'] ||
      metadata['twitter:title'] ||
      (Array.isArray(metadata.jsonld) &&
        metadata.jsonld.length > 0 &&
        (isNewsArticle(metadata.jsonld[0])
          ? metadata.jsonld[0].headline
          : metadata.jsonld.find(isNewsArticle)?.headline)) ||
      (metadata.headings &&
        metadata.headings.find((h: { level: string }) => h.level === 'h1')?.text) ||
      undefined;

    return typeof title === 'string' ? title : undefined;
  })(metadata);

  const author = ((metadata: urlMetadata.Result): string | undefined => {
    const author =
      metadata.author ||
      metadata['og:author'] ||
      (metadata.jsonld &&
        typeof metadata.jsonld === 'object' &&
        'author' in metadata.jsonld &&
        metadata.jsonld.author) ||
      (metadata.jsonld &&
        Array.isArray(metadata.jsonld) &&
        metadata.jsonld[1]?.author?.[0]?.name) ||
      (metadata.jsonld &&
        typeof metadata.jsonld.author === 'object' &&
        metadata.jsonld.author.name) ||
      (metadata.jsonld &&
        typeof metadata.jsonld.publisher === 'object' &&
        metadata.jsonld.publisher.name) ||
      metadata['twitter:creator'] ||
      undefined;
    return typeof author === 'string' ? author : undefined;
  })(metadata);

  const description = ((metadata: urlMetadata.Result): string | undefined => {
    const description =
      metadata.description ||
      metadata['og:description'] ||
      metadata['twitter:description'] ||
      undefined;

    return typeof description === 'string' ? description : undefined;
  })(metadata);

  const image = ((metadata: urlMetadata.Result): string | undefined => {
    const image =
      metadata.image ||
      metadata['og:image'] ||
      metadata['twitter:image'] ||
      metadata['twitter:image:src'] ||
      metadata['og:image:secure_url'] ||
      (metadata.jsonld && Array.isArray(metadata.jsonld) && metadata.jsonld[1]?.image?.[0]?.url) ||
      undefined;

    return typeof image === 'string' ? image : undefined;
  })(metadata);

  // Validate image URL
  let validImageUrl: string | undefined;

  // Check if image is a relative path and add domain if needed
  if (image && !image.startsWith('http')) {
    if (domain) {
      // Construct absolute URL using domain
      const absoluteUrl = new URL(image, `https://${domain}`).href;
      validImageUrl = absoluteUrl;
    } else {
      // If domain is not available, treat the image as is
      validImageUrl = image;
    }
  } else {
    // If image is already an absolute URL, use it as is
    validImageUrl = image;
  }

  //Check if the string can be separated by comma
  if (validImageUrl && validImageUrl.includes(',')) {
    const imageArray = validImageUrl.split(',');
    validImageUrl = imageArray[0];
  }

  if (!z.string().url().safeParse(validImageUrl).success) {
    validImageUrl = undefined;
  }

  return { title, description, image: validImageUrl, author, readable: false };
}

// Helper function to check if the given data is a NewsArticle JSON-LD object
function isNewsArticle(
  jsonldData: unknown
): jsonldData is { '@type': 'NewsArticle'; headline: string } {
  if (typeof jsonldData === 'object' && jsonldData !== null) {
    const data = jsonldData as { '@type'?: string; headline?: string };
    return data['@type'] === 'NewsArticle' && typeof data.headline === 'string';
  }
  return false;
}
