import config from '../config';

async function fetchWithTimeout(url: string, timeout: number) {
  try {
    const userAgent = config.app.userAgent;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Timeout reached while fetching ${url}`);
    }, timeout);

    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const mimeType = response.headers.get('content-type') ?? undefined;

    return { response, mimeType };
  } catch (error) {
    console.error(`Error fetching ${url}`, error);
    return { response: undefined, mimeType: undefined };
  }
}

export default {
  fetchWithTimeout
};
