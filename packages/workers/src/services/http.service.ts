import config from '../config';

async function fetchArticle(url: string) {
  try {
    const userAgent = config.app.userAgent;

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'text/html' }
    });

    const mimeType = response.headers.get('content-type') ?? undefined;

    return { response, mimeType };
  } catch (error) {
    console.error(`Error fetching ${url}`, error);
    return { response: undefined, mimeType: undefined };
  }
}

export default {
  fetchArticle
};
