import { z } from 'zod';

export function isValidLink(link: string | undefined): link is string {
  if (!link) return false;
  if (!z.string().url().safeParse(link).success) return false;
  return true;
}

export function isHtmlMimeType(mimeType: string | undefined) {
  if (!mimeType) return false;
  const baseMimeType = mimeType.split(';')[0].trim();
  return baseMimeType.toLowerCase() === 'text/html';
}
