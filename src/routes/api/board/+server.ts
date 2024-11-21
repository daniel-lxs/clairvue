import type { RequestHandler } from '@sveltejs/kit';
import {
  findBoardBySlug,
  createBoard,
  updateBoard,
  addFeedToBoard,
  removeFeedFromBoard
} from '@/server/services/board.service';
import {
  addFeedToBoardDto,
  createBoardDto,
  deleteFeedFromBoardDto,
  updateBoardDto
} from '@/server/dto/board.dto';
import { lucia, validateAuthSession } from '@/server/services/auth.service';

export const GET: RequestHandler = async ({ url, cookies }) => {
  try {
    const boardSlug = url.searchParams.get('slug');

    if (!boardSlug) {
      return new Response('Invalid board slug', { status: 400 });
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

    const board = await findBoardBySlug(authSession.user.id, boardSlug);

    if (!board) {
      return new Response('Board not found', { status: 404 });
    }

    return new Response(JSON.stringify(board), { status: 200 });
  } catch (error) {
    console.error('Error occurred on GET /api/board', error);
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

    const validationResult = createBoardDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    const createdBoard = await createBoard(validationResult.data.name, authSession.user.id);

    if (!createdBoard) {
      return new Response('Failed to create board', { status: 500 });
    }

    return new Response(JSON.stringify(createdBoard), { status: 200 });
  } catch (error) {
    console.error('Error occurred on POST /api/board', error);
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

    const validationResult = updateBoardDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await updateBoard(validationResult.data.id, validationResult.data);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on PATCH /api/board', error);
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

    const validationResult = addFeedToBoardDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await addFeedToBoard(validationResult.data.id, validationResult.data.feedId);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on PUT /api/board', error);
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

    const validationResult = deleteFeedFromBoardDto.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify(validationResult.error), { status: 400 });
    }

    await removeFeedFromBoard(validationResult.data.id, validationResult.data.feedId);

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error('Error occurred on DELETE /api/board', error);
    return new Response('Internal server error', { status: 500 });
  }
};
