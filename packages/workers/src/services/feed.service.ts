import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import config from '../config';

async function tryGetFeedLink(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': config.app.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
      if (rssLink && !rssLink.startsWith('http')) {
        //Assume relative URL
        return new URL(rssLink, url).toString();
      } else {
        return rssLink ?? undefined;
      }
    }

    if (atomLinkElement) {
      const atomLink = atomLinkElement.getAttribute('href');
      if (atomLink && !atomLink.startsWith('http')) {
        return new URL(atomLink, url).toString();
      } else {
        return atomLink ?? undefined;
      }
    }

    return undefined;
  } catch (error) {
    console.error('Could not parse link: ', error);
    return undefined;
  }
}

export default { tryGetFeedLink };
