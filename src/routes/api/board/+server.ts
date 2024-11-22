import type { RequestHandler } from '@sveltejs/kit';
import {
  findCollectionBySlug,
  createCollection,
  updateCollection,
  addFeedToCollection,
  removeFeedFromCollection
} from '@/server/services/collection.service';
import {
  addFeedToCollectionDto,
  createCollectionDto,
  deleteFeedFromCollectionDto,
  updateCollectionDto
} from '@/server/dto/collection.dto';
import { validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const collectionSlug = url.searchParams.get('slug');

    if (!collectionSlug) {
      return new Response('Invalid collection slug', { status: 400 });
    }

    const authSession = await validateAuthSession(cookies);
    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const collection = await findCollectionBySlug(authSession.user.id, collectionSlug);

    if (!collection) {
      return new Response('Collection not found', { status: 404 });
    }

    return new Response(JSON.stringify(collection), { status: 200 });
  } catch (error) {
    console.error('Error occurred on GET /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
    }

    const authSession = await validateAuthSession(cookies);
    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const validationResult = createCollectionDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    const createdCollection = await createCollection(
      validationResult.data.name,
      authSession.user.id
    );

    if (!createdCollection) {
      return new Response('Failed to create collection', { status: 500 });
    }

    return new Response(JSON.stringify(createdCollection), { status: 200 });
  } catch (error) {
    console.error('Error occurred on POST /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
    }

    const authSession = await validateAuthSession(cookies);
    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const validationResult = updateCollectionDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await updateCollection(validationResult.data.id, validationResult.data);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on PATCH /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
    }

    const authSession = await validateAuthSession(cookies);
    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const validationResult = addFeedToCollectionDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await addFeedToCollection(validationResult.data.id, validationResult.data.feedId);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on PUT /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
  try {
    const requestBody = await request.json();

    if (!requestBody) {
      return new Response('Missing body', { status: 400 });
    }

    const authSession = await validateAuthSession(cookies);
    if (
      !authSession ||
      !authSession.session ||
      !authSession.user ||
      authSession.session.expiresAt < new Date()
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    const validationResult = deleteFeedFromCollectionDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await removeFeedFromCollection(validationResult.data.id, validationResult.data.feedId);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on DELETE /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};
