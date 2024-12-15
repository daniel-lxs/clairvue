import articleService from '$lib/server/services/article.service';

export const GET = async ({ url, locals }) => {
  const userId = locals.authSession.user.id;

  const unread = url.searchParams.get('unread');
  const saved = url.searchParams.get('saved');

  if (unread) {
    const articlesResult = await articleService.findUnreadByUserId(userId);

    return articlesResult.match({
      ok: (articles) => new Response(JSON.stringify(articles), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  }

  if (saved) {
    const articlesResult = await articleService.findSavedByUserId(userId);

    return articlesResult.match({
      ok: (articles) => new Response(JSON.stringify(articles), { status: 200 }),
      err: (error) => new Response(error.message, { status: 500 })
    });
  }

  return new Response('Invalid request', { status: 400 });
};

export const PUT = async ({ request, locals }) => {
  const userId = locals.authSession.user.id;
  const { articleId, read, saved } = await request.json();

  if (!articleId) {
    return new Response('Article ID is required', { status: 400 });
  }

  if (read === undefined && saved === undefined) {
    return new Response('At least one interaction must be provided', { status: 400 });
  }

  const result = await articleService.updateInteractions(userId, articleId, read, saved);

  return result.match({
    ok: () => new Response('Interactions updated', { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};
