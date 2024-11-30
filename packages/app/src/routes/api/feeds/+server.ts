import { validateAuthSession } from '@/server/services/auth.service';
import feedService from '@/server/services/feed.service';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const take = Number(url.searchParams.get('take')) || 10;
    const skip = Number(url.searchParams.get('skip')) || 0;
    const authSession = await validateAuthSession(cookies);

    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const feeds = await feedService.findByUserId(authSession.user.id, take, skip);

    if (!feeds) {
      return new Response('Feed not found', { status: 404 });
    }

    return new Response(JSON.stringify(feeds), { status: 200 });
  } catch (error) {
    console.error('Error occurred on GET /api/feeds', error);
    return new Response('Internal server error', { status: 500 });
  }
};
