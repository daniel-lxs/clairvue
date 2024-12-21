import { type ReadableArticle, Result } from '@clairvue/types';
import { createHash } from 'crypto';
import { isValidLink, normalizeError } from '../utils';
import DOMPurify from 'isomorphic-dompurify';
import { JSDOM } from 'jsdom';
import { isProbablyReaderable, Readability } from '@mozilla/readability';

async function isReadable(url: string, response: Response): Promise<Result<boolean, Error>> {
  const documentResult = await extractAndSanitizeDocument(url, response);

  return documentResult.match({
    ok: (document) => Result.ok(isProbablyReaderable(document)),
    err: (error) => Result.err(error)
  });
}

async function retrieveReadableArticle(
  link: string,
  response: Response
): Promise<Result<ReadableArticle | false, Error>> {
  if (!isValidLink(link)) {
    return Result.err(new Error('Invalid link'));
  }

  const isReadableResult = await isReadable(link, response.clone());

  if (isReadableResult.isErr()) {
    return Result.err(isReadableResult.unwrapErr());
  }

  const articleIsReadable = isReadableResult.unwrap();

  const documentResult = await extractAndSanitizeDocument(link, response.clone());

  if (documentResult.isErr()) {
    return Result.err(documentResult.unwrapErr());
  }

  try {
    if (articleIsReadable) {
      // Modify image paths to absolute URLs
      const document = documentResult.unwrap();
      const images = document.querySelectorAll('img');
      images.forEach((imgElement) => {
        const imgSrc = imgElement.getAttribute('src');
        if (imgSrc && !imgSrc.startsWith('http')) {
          // Convert relative image path to absolute URL
          const absoluteUrl = new URL(imgSrc, link).href;
          imgElement.setAttribute('src', absoluteUrl);
        }
      });

      // Parse the modified HTML using Readability
      const parsedArticle = new Readability(document).parse();
      if (!parsedArticle) {
        return Result.err(new Error('Failed to parse article'));
      }

      // Hash the content to check for updates
      const hash = createHash('sha256').update(parsedArticle.textContent).digest('hex');
      const readableArticle: ReadableArticle = {
        ...parsedArticle,
        contentHash: hash,
        createdAt: new Date().toISOString()
      };

      return Result.ok(readableArticle);
    }
    return Result.ok(false);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while retrieving readable article:', error);
    return Result.err(error);
  }
}

async function extractAndSanitizeDocument(
  link: string,
  response: Response
): Promise<Result<Document, Error>> {
  try {
    const html = await response.text();
    const cleanHtml = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'style', 'title', 'noscript', 'iframe'],
      FORBID_ATTR: ['style', 'class']
    });
    const dom = new JSDOM(cleanHtml, { url: link });
    return Result.ok(dom.window.document);
  } catch (e) {
    const error = normalizeError(e);
    console.error('Error occurred while extracting and sanitizing document:', error);
    return Result.err(error);
  }
}

export default {
  retrieveReadableArticle,
  isReadable
};
