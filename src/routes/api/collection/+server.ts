import type { RequestHandler } from '@sveltejs/kit';
import collectionService from '@/server/services/collection.service';
import {
  addFeedToCollectionDto,
  addFeedsToCollectionDto,
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

    const collection = await collectionService.findBySlug(authSession.user.id, collectionSlug);

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

    const createdCollection = await collectionService.create(
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

    await collectionService.update(validationResult.data.id, validationResult.data);

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

    // Try to validate as multiple feeds first
    const multiValidationResult = addFeedsToCollectionDto.safeParse(requestBody);
    if (multiValidationResult.success) {
      // Handle multiple feeds
      for (const feedId of multiValidationResult.data.feedIds) {
        await collectionService.addFeedToCollection(multiValidationResult.data.id, feedId);
      }
      return new Response(null, { status: 200 });
    }

    // Fall back to single feed validation
    const singleValidationResult = addFeedToCollectionDto.safeParse(requestBody);
    if (!singleValidationResult.success) {
      return new Response(JSON.stringify(singleValidationResult.error), { status: 400 });
    }

    await collectionService.addFeedToCollection(
      singleValidationResult.data.id,
      singleValidationResult.data.feedId
    );
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

    await collectionService.removeFeedFromCollection(
      validationResult.data.id,
      validationResult.data.feedId
    );

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on DELETE /api/collection', error);
    return new Response('Internal server error', { status: 500 });
  }
};
