// Live search crawl provider — fetches actual URL content using jsdom

import { SearchCrawlProvider, CrawledContent } from './index';

export class JsdomSearchCrawl implements SearchCrawlProvider {
  private timeout = 5000; // 5 second timeout

  async fetchContent(url: string): Promise<CrawledContent> {
    try {
      // Validate URL
      new URL(url);

      // Fetch the page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (BlogAgent/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          url,
          title: 'Error',
          content: '',
          bodyText: '',
          headings: [],
          metadata: {},
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      const html = await response.text();

      // Parse with JSDOM
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(html, { url });
      const { document } = dom.window;

      // Extract title
      let title =
        document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        document.querySelector('title')?.textContent ||
        'Untitled';

      // Extract description
      const description =
        document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        document.querySelector('meta[name="description"]')?.getAttribute('content') ||
        '';

      // Extract headings (h1, h2, h3)
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => (h.textContent || '').trim())
        .filter((h) => h.length > 0);

      // Extract main content (remove scripts, styles, nav, footer)
      const removeElements = ['script', 'style', 'nav', 'footer', 'noscript', 'svg'];
      removeElements.forEach((tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
      });

      // Get main body text
      const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
      const bodyText = (mainContent?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();

      // Extract author from common meta tags
      const author =
        document.querySelector('meta[name="author"]')?.getAttribute('content') ||
        document.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
        undefined;

      // Extract published date
      const publishedDate =
        document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
        document.querySelector('meta[name="publish_date"]')?.getAttribute('content') ||
        document.querySelector('time')?.getAttribute('datetime') ||
        undefined;

      // Extract image
      const imageUrl =
        document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        document.querySelector('img')?.getAttribute('src') ||
        undefined;

      // Extract all meta tags for metadata
      const metadata: Record<string, string> = {};
      document.querySelectorAll('meta').forEach((meta) => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      return {
        url,
        title,
        description,
        content: bodyText.substring(0, 2000), // First 2000 chars
        bodyText,
        headings,
        author,
        publishedDate,
        imageUrl,
        metadata,
        statusCode: 200,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        url,
        title: 'Error',
        content: '',
        bodyText: '',
        headings: [],
        metadata: {},
        statusCode: 0,
        error: errorMsg,
      };
    }
  }
}
