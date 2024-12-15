import { z } from 'zod';
import userRepository from '@/server/data/repositories/user.repository';
import collectionService from './collection.service';
import feedService from './feed.service';
import argon2 from 'argon2';
import { generateId } from '$lib/utils';
import { Result, type User } from '@clairvue/types';

const validateUserForm = z.object({
  username: z
    .string()
    .regex(/^[a-z0-9_-]+$/i, 'Username must only consist of lowercase letters, 0-9, -, and _')
    .min(4, 'Username must be between 4 ~ 31 characters')
    .max(31, 'Username must be between 4 ~ 31 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(255, 'Password too long')
});

const validateUserInput = async (
  username: string,
  password: string
): Promise<Result<true, Error>> => {
  const result = validateUserForm.safeParse({ username, password });
  if (!result.success) {
    return Result.err(
      new Error('Invalid username or password', {
        cause: result.error
      })
    );
  }
  return Result.ok(true);
};

const login = async (username: string, password: string): Promise<Result<User, Error>> => {
  const validationResult = await validateUserInput(username, password);

  if (validationResult.isErr()) {
    return Result.err(validationResult.unwrapErr());
  }

  const existingUserResult = await userRepository.findByUsername(username);

  // Simulate a delay to prevent timing attacks
  //TODO: Replace with a better solution
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return existingUserResult.match({
    ok: async (user) => {
      if (!user) {
        return Result.err(new Error('Invalid username or password'));
      }

      const validPassword = await argon2.verify(user.hashedPassword, password);

      if (!validPassword) {
        return Result.err(new Error('Invalid username or password'));
      }

      return Result.ok(user);
    },
    err: (error) => {
      return Result.err(error);
    }
  });
};

const signup = async (username: string, password: string): Promise<Result<User, Error>> => {
  const validationResult = await validateUserInput(username, password);

  if (validationResult.isErr()) {
    return Result.err(validationResult.unwrapErr());
  }

  const existingUserResult = await userRepository.findByUsername(username);

  if (existingUserResult.isOk()) {
    const user = existingUserResult.unwrap();

    if (user) {
      return Result.err(new Error('User already exists'));
    }
  }

  const hashedPassword = await argon2.hash(password);
  const userId = generateId(15);

  const result = await userRepository.create({
    id: userId,
    username,
    hashedPassword
  });

  // Create a default collection for the user
  const defaultCollectionResult = await collectionService.createDefault('All Feeds', userId);

  if (defaultCollectionResult.isErr()) {
    return Result.err(defaultCollectionResult.unwrapErr());
  }

  const defaultCollection = defaultCollectionResult.unwrap();

  const defaultFeedResult = await feedService.createFeed(
    {
      name: 'Imported Articles',
      description: 'Articles you have imported',
      link: `default-feed-${userId}`,
      collectionId: defaultCollection?.id
    },
    userId
  );

  if (defaultFeedResult.isErr()) {
    return Result.err(defaultFeedResult.unwrapErr());
  }

  return result;
};

export default {
  login,
  signup
};
