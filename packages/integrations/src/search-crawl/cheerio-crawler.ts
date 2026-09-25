// Fallback search crawl provider using Cheerio — lightweight HTML parsing

import { SearchCrawlProvider, CrawledContent } from './index';
import { load } from 'cheerio';
import fetch from 'node-fetch';

export class CheerioSearchCrawl implements SearchCrawlProvider {
  private timeout = 10000; // 10 second timeout

  async fetchContent(url: string): Promise<CrawledContent> {
    try {
      // Validate URL
      new URL(url);

      // Fetch the page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal as any,
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
      const $ = load(html);

      // Extract title
      let title =
        $('meta[property="og:title"]').attr('content') ||
        $('title').text() ||
        'Untitled';

      // Extract description
      const description =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        '';

      // Extract author
      const author =
        $('meta[name="author"]').attr('content') ||
        $('meta[property="article:author"]').attr('content');

      // Extract published date
      const publishedDate =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="publish_date"]').attr('content') ||
        $('time').attr('datetime');

      // Extract image
      const imageUrl =
        $('meta[property="og:image"]').attr('content') ||
        $('img').first().attr('src');

      // Extract headings
      const headings: string[] = [];
      $('h1, h2, h3').each((_i, el) => {
        const text = $(el).text().trim();
        if (text) headings.push(text);
      });

      // Extract main content
      const main = $('main').length > 0 ? $('main') : $('article').length > 0 ? $('article') : $('body');

      // Remove script, style, nav, footer
      main.find('script, style, nav, footer, noscript').remove();

      const bodyText = main
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      // Extract all metadata
      const metadata: Record<string, string> = {};
      $('meta').each((_i, el) => {
        const name = $(el).attr('name') || $(el).attr('property');
        const content = $(el).attr('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      return {
        url,
        title,
        description,
        content: bodyText.substring(0, 2000),
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
      console.error('[Cheerio] Crawl error:', errorMsg);

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
