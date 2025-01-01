import feedService from '@/server/services/feed.service';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }
  const encodedFeedLink = url.searchParams.get('link');

  if (!encodedFeedLink) {
    return new Response('Missing feed link', { status: 400 });
  }

  const feedLink = atob(encodedFeedLink);

  if (!feedLink) {
    return new Response('Invalid feed link', { status: 400 });
  }

  const feedInfoResult = await feedService.fetchAndParseFeed(feedLink);

  return feedInfoResult.match({
    ok: (feedInfo) => {
      return new Response(JSON.stringify(feedInfo), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    err: (error) => {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  });
};
