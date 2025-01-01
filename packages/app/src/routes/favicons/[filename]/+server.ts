import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFavicon } from '$lib/server/services/favicon.service';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
  const { filename } = params;

  // Basic security check to prevent directory traversal
  if (filename.includes('..') || !filename) {
    throw error(400, 'Invalid filename');
  }

  const result = await readFavicon(filename);
  if (result.isErr()) {
    throw error(404, 'Favicon not found');
  }

  // Set content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentType =
    ext === '.ico'
      ? 'image/x-icon'
      : ext === '.png'
        ? 'image/png'
        : ext === '.svg'
          ? 'image/svg+xml'
          : 'image/x-icon';

  return new Response(result.unwrap(), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    }
  });
};
