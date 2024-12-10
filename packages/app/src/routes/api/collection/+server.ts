import type { RequestHandler } from '@sveltejs/kit';
import collectionService from '@/server/services/collection.service';
import {
  addFeedsToCollectionDto,
  createCollectionDto,
  deleteFeedFromCollectionDto,
  updateCollectionDto
} from '@/server/dto/collection.dto';
import authService from '@/server/services/auth.service';
import { parseErrorMessages } from '@/utils';

export const GET: RequestHandler = async ({ url, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionSlug = url.searchParams.get('slug');

  if (!collectionSlug) {
    return new Response('Invalid collection slug', { status: 400 });
  }

  const collectionResult = await collectionService.findBySlug(authSession.user.id, collectionSlug);

  return collectionResult.match({
    ok: (collection) => new Response(JSON.stringify(collection), { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const { success, data: validationData, error } = createCollectionDto.safeParse(requestBody);
  if (!success) {
    return new Response(JSON.stringify(error), { status: 400 });
  }

  const collectionResult = await collectionService.create(validationData.name, authSession.user.id);

  if (collectionResult.isOk()) {
    if (validationData.feedIds && validationData.feedIds.length > 0) {
      const collection = collectionResult.unwrap();
      const feedAssignmentsResult = await collectionService.addFeedsToCollection(
        collection.id,
        validationData.feedIds
      );

      if (feedAssignmentsResult.isOk()) {
        const { validationErrors, insertErrors } = feedAssignmentsResult.unwrap();

        return new Response(
          JSON.stringify({
            collection,
            assignmentErrors: {
              validationErrors: parseErrorMessages(validationErrors),
              insertErrors: parseErrorMessages(insertErrors)
            }
          }),
          { status: 201 }
        );
      }

      return new Response(
        JSON.stringify({
          collection,
          assignmentErrors: {
            validationErrors: [],
            insertErrors: [feedAssignmentsResult.unwrapErr().message]
          }
        }),
        { status: 201 }
      );
    }
  }
  return new Response('Internal server error', { status: 500 });
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const validationResult = updateCollectionDto.safeParse(requestBody);
  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  const updateResult = await collectionService.update(
    validationResult.data.id,
    validationResult.data
  );

  return updateResult.match({
    ok: () => {
      return new Response('OK', { status: 200 });
    },
    err: (error) => {
      return new Response(error.message, { status: 500 });
    }
  });
};

export const PUT: RequestHandler = async ({ url, request, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('id');
  const {
    name,
    feedsToAdd,
    feedsToRemove
  }: { name?: string; feedsToAdd?: string[]; feedsToRemove?: string[] } = await request.json();

  if (!collectionId) {
    return new Response('Missing collection ID', { status: 400 });
  }

  let feedAssignmentErrors: Error[] = [];
  let feedRemovalErrors: Error[] = [];

  if (name) {
    const result = await collectionService.update(collectionId, { name });
    if (result.isErr()) {
      return new Response(result.unwrapErr().message, { status: 500 });
    }
  }

  if (feedsToAdd && feedsToAdd.length > 0) {
    const validationResult = addFeedsToCollectionDto.safeParse({
      id: collectionId,
      feedIds: feedsToAdd
    });

    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    const feedAssignmentsResult = await collectionService.addFeedsToCollection(
      validationResult.data.id,
      feedsToAdd
    );

    if (feedAssignmentsResult.isErr()) {
      return new Response(feedAssignmentsResult.unwrapErr().message, { status: 400 });
    }

    const { validationErrors, insertErrors } = feedAssignmentsResult.unwrap();
    feedAssignmentErrors = [...validationErrors, ...insertErrors];
  }

  if (feedsToRemove && feedsToRemove.length > 0) {
    for (const feedId of feedsToRemove) {
      const validationResult = deleteFeedFromCollectionDto.safeParse({
        id: collectionId,
        feedId
      });

      if (!validationResult.success) {
        return new Response(JSON.stringify(validationResult.error), { status: 400 });
      }

      const removeResult = await collectionService.removeFeedFromCollection(
        validationResult.data.id,
        validationResult.data.feedId
      );

      if (removeResult.isErr()) {
        feedRemovalErrors.push(removeResult.unwrapErr());
      }
    }
  }

  return new Response(
    JSON.stringify({
      assignmentErrors: parseErrorMessages(feedAssignmentErrors),
      removalErrors: parseErrorMessages(feedRemovalErrors)
    }),
    { status: 200 }
  );
};

export const DELETE: RequestHandler = async ({ url, cookies, locals }) => {
  const { authSession } = locals;

  if (!authSession) {
    return new Response('Unauthorized', { status: 401 });
  }

  const collectionId = url.searchParams.get('collectionId');
  const feedId = url.searchParams.get('feedId');

  if (!collectionId || !feedId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  const validationResult = deleteFeedFromCollectionDto.safeParse({
    collectionId,
    feedId
  });

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  const removeResult = await collectionService.removeFeedFromCollection(
    validationResult.data.id,
    validationResult.data.feedId
  );

  return removeResult.match({
    ok: () => new Response('OK', { status: 200 }),
    err: (error) => new Response(error.message, { status: 500 })
  });
};
