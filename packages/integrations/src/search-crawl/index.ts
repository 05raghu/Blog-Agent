// Search/Crawl provider interface — fetches and extracts content from URLs

export interface CrawledContent {
  url: string;
  title: string;
  description?: string;
  content: string; // main text body
  bodyText: string; // raw text extracted from page
  headings: string[]; // h1, h2, h3 text
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  metadata: Record<string, string>;
  statusCode?: number;
  error?: string;
}

export interface SearchCrawlProvider {
  fetchContent(url: string): Promise<CrawledContent>;
}

// Re-exports for module resolution
import { MockSearchCrawl } from './mock';
import { JsdomSearchCrawl } from './jsdom';
import { PuppeteerSearchCrawl } from './puppeteer-crawler';
import { CheerioSearchCrawl } from './cheerio-crawler';

export { MockSearchCrawl };
export { JsdomSearchCrawl };
export { PuppeteerSearchCrawl };
export { CheerioSearchCrawl };
