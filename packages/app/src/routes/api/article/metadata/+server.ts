import { hashString } from '$lib/utils';
import { getArticleMetadataQueue, getQueueEvents } from '$lib/server/queue/articles';

export const POST = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { url } = await request.json();

  try {
    const articleMetadataQueue = getArticleMetadataQueue();
    const queueName = articleMetadataQueue.name;
    const ttl = 1000 * 60 * 1; // 1 minute
    const job = await articleMetadataQueue.add(
      'get-article-metadata',
      { url },
      {
        attempts: 3,
        deduplication: {
          id: hashString(url)
        },
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    );

    const result = await job.waitUntilFinished(getQueueEvents(queueName), ttl);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
};
