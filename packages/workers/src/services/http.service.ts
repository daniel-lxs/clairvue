import config from '../config';
import { Result } from '@clairvue/types';
import { normalizeError } from '../utils';

async function fetchArticle(
  url: string
): Promise<Result<{ response: Response; mimeType: string | undefined }, Error>> {
  try {
    const userAgent = config.app.userAgent;

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'text/html' }
    });

    if (!response.ok) {
      return Result.err(new Error(`HTTP error! status: ${response.status}`));
    }

    const mimeType = response.headers.get('content-type') ?? undefined;

    return Result.ok({ response, mimeType });
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while fetching article:', error);
    return Result.err(error);
  }
}

export default {
  fetchArticle
};
