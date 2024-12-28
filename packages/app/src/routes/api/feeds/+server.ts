import authService from '@/server/services/auth.service';
import feedService from '@/server/services/feed.service';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }
  const take = Number(url.searchParams.get('take')) || 10;
  const skip = Number(url.searchParams.get('skip')) || 0;

  const feedsResult = await feedService.findByUserId(authSession.user.id, take, skip);

  return feedsResult.match({
    ok: (feeds) => {
      if (!feeds) {
        return new Response('Feed not found', { status: 404 });
      }
      return new Response(JSON.stringify(feeds), { status: 200 });
    },
    err: (error) => {
      return new Response(error.message, { status: 500 });
    }
  });
};
