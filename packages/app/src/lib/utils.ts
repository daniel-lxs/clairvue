import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { generateRandomString } from '@oslojs/crypto/random';
import { sha256 } from '@oslojs/crypto/sha2';
import type { RandomReader } from '@oslojs/crypto/random';
import { toast } from 'svelte-sonner';
import { z } from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, number | string | undefined>): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, '');
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t
      });
    },
    easing: cubicOut
  };
};

export function calculateAge(date: Date | string, format: 'short' | 'long' = 'short'): string {
  if (typeof date === 'string') date = new Date(date);

  const now = new Date();
  const timeDifference = now.getTime() - date.getTime();
  const minutes = Math.floor(timeDifference / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.4375);
  const years = Math.floor(months / 12);

  if (format === 'long') {
    if (years > 0) return `${years} year${years !== 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months !== 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes === 0) return 'just now';
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}M ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes === 0) return 'now';
  return `${minutes}m ago`;
}

export function truncateDescription(description: string, maxLength: number = 160) {
  if (description.length <= maxLength) return description;

  const words = description.split(' ');
  let truncatedDescription = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const newLength = truncatedDescription.length + word.length;

    if (newLength <= maxLength) {
      truncatedDescription += `${word} `;
    } else {
      let result = truncatedDescription.trim();
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      return `${result}`;
    }
  }

  return truncatedDescription.trim();
}

export function generateId(length: number): string {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  return generateRandomString(random, alphabet, length);
}

export function showToast(
  title: string,
  description: string,
  toastState: 'error' | 'success' | 'info' | 'warning' | 'loading' = 'success',
  action?: {
    label: string;
    onClick: () => void;
  }
) {
  toast[toastState](title, {
    description,
    action
  });
}

export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown error', { cause: error });
}

export function parseErrorMessages(errors: Error[]): string[] {
  return errors.map((error) => error.message);
}

export function validateDateString(dateString: string): boolean {
  return z.string().datetime().safeParse(dateString).success;
}

/**
 * Synchronously hashes a string using the SHA-256 algorithm.
 * @param input - The string to hash.
 * @returns The first 16 characters of the hashed string in hexadecimal format.
 */
export function hashString(input: string): string {
  const inputBuffer = new TextEncoder().encode(input);
  const hash = sha256(inputBuffer);
  const output = new Uint8Array(hash);
  return output
    .subarray(0, 16)
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
    .substring(0, 16);
}
