import type { RequestHandler } from '@sveltejs/kit';
import boardRepository from '@/server/data/repositories/board';
import {
  addFeedToBoardDto,
  createBoardDto,
  deleteFeedFromBoardDto,
  updateBoardDto,
  type AddFeedToBoardDto
} from '@/server/dto/boardDto';
import { lucia, validateAuthSession } from '@/server/services/auth';
import type { Board } from '@/server/data/schema';
import { z } from 'zod';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const boardSlug = url.searchParams.get('slug');

  if (!boardSlug || boardSlug.length !== 8) {
    return new Response('Invalid board slug', { status: 400 });
  }

  const cookieHeader = cookies.get('auth_session');
  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const authSession = await validateAuthSession(cookieHeader);
  if (
    !authSession ||
    !authSession.session ||
    !authSession.user ||
    authSession.session.expiresAt < new Date()
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const board = await boardRepository.findBySlug(authSession.user.id, boardSlug);

  if (!board) {
    return new Response('Board not found', { status: 404 });
  }

  return new Response(JSON.stringify(board), { status: 200 });
};

export const POST: RequestHandler = async ({ request }) => {
  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = lucia.readSessionCookie(cookieHeader);
  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session || !user || session.expiresAt < new Date()) {
    return new Response('Unauthorized', { status: 401 });
  }

  const validationResult = createBoardDto.safeParse(requestBody);
  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  const createdBoard = await boardRepository.create({
    name: requestBody.name,
    userId: user.id
  });

  return new Response(JSON.stringify(createdBoard), { status: 200 });
};

export const PATCH: RequestHandler = async ({ request }) => {
  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = lucia.readSessionCookie(cookieHeader);

  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user || session.expiresAt < new Date()) {
    return new Response('Unauthorized', { status: 401 });
  }

  const validationResult = updateBoardDto.safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  const { data } = validationResult;

  const boardToUpdate: Pick<Board, 'name'> = {
    name: data.name
  };

  try {
    await boardRepository.update(data.id, boardToUpdate);
    return new Response(JSON.stringify({ message: 'Board updated successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error updating board:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while updating the board' }), {
      status: 500
    });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = lucia.readSessionCookie(cookieHeader);

  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user || session.expiresAt < new Date()) {
    return new Response('Unauthorized', { status: 401 });
  }

  const validationResult = z.array(addFeedToBoardDto).safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  try {
    await boardRepository.addFeedsToBoard(requestBody as AddFeedToBoardDto[]);
    return new Response(JSON.stringify({ message: 'Feeds added successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error adding feeds to board:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while adding feeds to the board' }),
      {
        status: 500
      }
    );
  }
};

export const DELETE: RequestHandler = async ({ request }) => {
  const requestBody = await request.json();

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  if (!requestBody) {
    return new Response('Missing body', { status: 400 });
  }

  const cookieHeader = request.headers.get('Cookie');

  if (!cookieHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = lucia.readSessionCookie(cookieHeader);

  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user || session.expiresAt < new Date()) {
    return new Response('Unauthorized', { status: 401 });
  }

  const validationResult = deleteFeedFromBoardDto.safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(JSON.stringify(validationResult.error), { status: 400 });
  }

  try {
    await boardRepository.deleteFeedFromBoard(
      validationResult.data.id,
      validationResult.data.feedId
    );
  } catch (error) {
    return new Response(JSON.stringify('Something went wrong'), { status: 500 });
  }

  return new Response(JSON.stringify('Feed deleted successfully'), { status: 200 });
};
