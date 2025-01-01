import { Result } from '@clairvue/types';
import { JSDOM } from 'jsdom';
import path from 'path';
import fs from 'fs/promises';
import { generateId } from '../../utils';

const FAVICON_DIR = 'static/favicons';

async function ensureFaviconDirectory(): Promise<Result<true, Error>> {
  try {
    await fs.mkdir(FAVICON_DIR, { recursive: true });
    return Result.ok(true);
  } catch (err) {
    console.error('Error creating favicon directory:', err);
    return Result.err(err instanceof Error ? err : new Error('Failed to create favicon directory'));
  }
}

async function downloadFile(url: string, filename: string): Promise<Result<true, Error>> {
  try {
    const response = await fetch(url);
    if (!response.ok) return Result.err(new Error(`HTTP error! status: ${response.status}`));
    const buffer = await response.arrayBuffer();
    await fs.writeFile(path.join(FAVICON_DIR, filename), Buffer.from(buffer));
    return Result.ok(true);
  } catch (err) {
    console.error(`Error downloading favicon from ${url}:`, err);
    return Result.err(err instanceof Error ? err : new Error('Failed to download favicon'));
  }
}

async function findFaviconUrl(siteUrl: string): Promise<Result<string, Error>> {
  try {
    const response = await fetch(siteUrl);
    if (!response.ok) return Result.err(new Error(`HTTP error! status: ${response.status}`));
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Check for favicon in link tags
    const linkTags = document.querySelectorAll('link');
    for (const link of linkTags) {
      const rel = link.getAttribute('rel')?.toLowerCase();
      if (rel?.includes('icon') || rel?.includes('shortcut icon')) {
        const href = link.getAttribute('href');
        if (href) {
          return Result.ok(new URL(href, siteUrl).toString());
        }
      }
    }

    // Fallback to default favicon.ico
    return Result.ok(new URL('/favicon.ico', siteUrl).toString());
  } catch (err) {
    console.error(`Error finding favicon for ${siteUrl}:`, err);
    return Result.err(err instanceof Error ? err : new Error('Failed to find favicon URL'));
  }
}

export async function downloadFavicon(feedUrl: string): Promise<Result<string, Error>> {
  const dirResult = await ensureFaviconDirectory();
  if (dirResult.isErr()) {
    return Result.err(dirResult.unwrapErr());
  }

  try {
    const siteUrl = new URL(feedUrl).origin;
    const faviconUrlResult = await findFaviconUrl(siteUrl);

    if (faviconUrlResult.isErr()) {
      return faviconUrlResult;
    }

    const faviconUrl = faviconUrlResult.unwrap();
    //This might have a query param like ?v=1.2.3, so we need to remove it
    const url = new URL(faviconUrl);
    url.search = '';
    const extension = path.extname(url.toString()) || '.ico';
    const filename = `${generateId(10)}${extension}`;

    const downloadResult = await downloadFile(faviconUrl, filename);
    if (downloadResult.isErr()) {
      return downloadResult;
    }

    return Result.ok(`/favicons/${filename}`);
  } catch (err) {
    console.error('Error in downloadFavicon:', err);
    return Result.err(err instanceof Error ? err : new Error('Failed to download favicon'));
  }
}

export async function deleteFavicon(faviconPath: string): Promise<Result<true, Error>> {
  if (!faviconPath) return Result.ok(true);

  try {
    const filename = path.basename(faviconPath);
    await fs.unlink(path.join(FAVICON_DIR, filename));
    return Result.ok(true);
  } catch (err) {
    console.error('Error deleting favicon:', err);
    return Result.err(err instanceof Error ? err : new Error('Failed to delete favicon'));
  }
}
