import feedService from '@/server/services/feed.service';
import type { RequestHandler } from '@sveltejs/kit';
import Parser from 'rss-parser';

export const GET: RequestHandler = async ({ url }) => {
  const encodedFeedLink = url.searchParams.get('link');

  if (!encodedFeedLink) {
    return new Response('Missing feed link', { status: 400 });
  }

  const feedLink = atob(encodedFeedLink);

  if (!feedLink) {
    return new Response('Invalid feed link', { status: 400 });
  }

  try {
    const feedInfo = await fetchAndParseFeed(feedLink);
    return new Response(JSON.stringify({ ...feedInfo, link: feedLink }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const alternativeLink = await feedService.tryGetFeedLink(feedLink);
    if (!alternativeLink) {
      return new Response('Could not find alternative feed link', { status: 404 });
    }

    const feedInfo = await fetchAndParseFeed(alternativeLink);
    return new Response(JSON.stringify({ ...feedInfo, link: alternativeLink }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

async function fetchAndParseFeed(
  url: string
): Promise<{ title: string; description: string | undefined }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const feedData = await response.text();
  const parsedData = await new Parser().parseString(feedData);

  if (!parsedData || !parsedData.title) {
    throw new Error('Invalid feed');
  }

  const { title, description } = parsedData;

  return {
    title,
    description
  };
}
