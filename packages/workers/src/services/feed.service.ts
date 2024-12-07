import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import config from '../config';
import { Result } from '@clairvue/types';
import { normalizeError } from '../utils';

async function tryGetFeedUrl(url: string): Promise<Result<string, Error>> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': config.app.userAgent
      }
    });

    if (!response.ok) {
      return Result.err(new Error(`HTTP error! status: ${response.status}`));
    }

    const html = await response.text();

    const cleanHtml = DOMPurify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ALLOWED_TAGS: ['head', 'link']
    });

    const { document } = new JSDOM(cleanHtml).window;

    const rssLinkElement = document.querySelector(
      'link[rel="alternate"][type="application/rss+xml"]'
    );
    const atomLinkElement = document.querySelector(
      'link[rel="alternate"][type="application/atom+xml"]'
    );

    if (rssLinkElement) {
      const rssLink = rssLinkElement.getAttribute('href');
      if (rssLink) {
        if (!rssLink.startsWith('http')) {
          //Assume relative URL
          return Result.ok(new URL(rssLink, url).toString());
        } else {
          return Result.ok(rssLink);
        }
      }
      return Result.err(new Error('Invalid RSS link'));
    }

    if (atomLinkElement) {
      const atomLink = atomLinkElement.getAttribute('href');
      if (atomLink) {
        if (!atomLink.startsWith('http')) {
          return Result.ok(new URL(atomLink, url).toString());
        } else {
          return Result.ok(atomLink);
        }
      }
      return Result.err(new Error('Invalid Atom link'));
    }

    return Result.err(new Error('No valid feed found'));
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while getting feed link:', error);
    return Result.err(error);
  }
}

export default { tryGetFeedUrl };
