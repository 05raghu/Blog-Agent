// Live search crawl provider using Puppeteer — real browser automation

import { SearchCrawlProvider, CrawledContent } from './index';
import puppeteer, { Browser } from 'puppeteer';

export class PuppeteerSearchCrawl implements SearchCrawlProvider {
  private browser: Browser | null = null;
  private timeout = 15000; // 15 second timeout per page

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--no-first-run',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        });
      } catch (err) {
        console.error('[Puppeteer] Failed to launch browser:', err);
        throw new Error('Browser launch failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (err) {
        console.error('[Puppeteer] Failed to close browser:', err);
      }
    }
  }

  async fetchContent(url: string): Promise<CrawledContent> {
    let browser: Browser | null = null;
    let page: any = null;

    try {
      // Validate URL
      new URL(url);

      browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to page with timeout
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout,
      });

      // Extract metadata
      const pageData = await page.evaluate(() => {
        // Get title
        const titleTag = document.querySelector('title');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const title =
          ogTitle?.getAttribute('content') || titleTag?.textContent || 'Untitled';

        // Get description
        const ogDescription = document.querySelector(
          'meta[property="og:description"]'
        );
        const metaDescription = document.querySelector(
          'meta[name="description"]'
        );
        const description =
          ogDescription?.getAttribute('content') ||
          metaDescription?.getAttribute('content') ||
          '';

        // Get author
        const authorMeta = document.querySelector('meta[name="author"]');
        const author = authorMeta?.getAttribute('content') || undefined;

        // Get published date
        const pubDate =
          document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
          document.querySelector('meta[name="publish_date"]')?.getAttribute('content') ||
          document.querySelector('time')?.getAttribute('datetime') ||
          undefined;

        // Get image
        const ogImage = document.querySelector('meta[property="og:image"]');
        const firstImg = document.querySelector('img');
        const imageUrl =
          ogImage?.getAttribute('content') || firstImg?.getAttribute('src') || undefined;

        // Extract headings
        const headings: string[] = [];
        document.querySelectorAll('h1, h2, h3').forEach((h) => {
          const text = (h.textContent || '').trim();
          if (text) headings.push(text);
        });

        // Extract main content
        const main =
          document.querySelector('main') ||
          document.querySelector('article') ||
          document.body;

        // Remove script, style, nav, footer
        const clone = main.cloneNode(true) as Element;
        ['script', 'style', 'nav', 'footer', 'noscript'].forEach((tag) => {
          clone.querySelectorAll(tag).forEach((el) => el.remove());
        });

        const bodyText = (clone.textContent || '')
          .replace(/\s+/g, ' ')
          .trim();

        return {
          title,
          description,
          author,
          publishedDate: pubDate,
          imageUrl,
          headings,
          bodyText,
        };
      });

      // Get all metadata
      const metadata: Record<string, string> = {};
      const metaTags = await page.$$eval('meta', (metas: any[]) => {
        return metas.map((m) => ({
          name: m.getAttribute('name') || m.getAttribute('property') || '',
          content: m.getAttribute('content') || '',
        }));
      });

      metaTags.forEach((tag) => {
        if (tag.name && tag.content) {
          metadata[tag.name] = tag.content;
        }
      });

      await page.close();

      return {
        url,
        title: pageData.title,
        description: pageData.description,
        content: pageData.bodyText.substring(0, 2000),
        bodyText: pageData.bodyText,
        headings: pageData.headings,
        author: pageData.author,
        publishedDate: pageData.publishedDate,
        imageUrl: pageData.imageUrl,
        metadata,
        statusCode: 200,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Puppeteer] Crawl error:', errorMsg);

      if (page) {
        try {
          await page.close();
        } catch (closeErr) {
          console.error('[Puppeteer] Failed to close page:', closeErr);
        }
      }

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
