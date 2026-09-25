// API route: POST /api/knowledge/sources/fetch-content
// Fetches and extracts content from a URL

import { NextRequest, NextResponse } from 'next/server';

// Crawl mode configuration
const CRAWL_MODE = process.env.CRAWL_MODE || 'mock'; // 'mock', 'jsdom', or 'live'

async function getCrawlProvider(primary: 'puppeteer' | 'jsdom' | 'cheerio' | 'mock') {
  if (primary === 'puppeteer') {
    const { PuppeteerSearchCrawl } = await import('@blog-agent/integrations');
    return new PuppeteerSearchCrawl();
  } else if (primary === 'jsdom') {
    const { JsdomSearchCrawl } = await import('@blog-agent/integrations');
    return new JsdomSearchCrawl();
  } else if (primary === 'cheerio') {
    const { CheerioSearchCrawl } = await import('@blog-agent/integrations');
    return new CheerioSearchCrawl();
  } else {
    const { MockSearchCrawl } = await import('@blog-agent/integrations');
    return new MockSearchCrawl();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing required field: url' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Try crawlers in priority order
    let content;

    if (CRAWL_MODE === 'mock') {
      // Pure mock mode
      const crawler = await getCrawlProvider('mock');
      content = await crawler.fetchContent(url);
    } else if (CRAWL_MODE === 'live') {
      // Try jsdom first (works for most sites)
      console.log(`[CRAWL] Trying jsdom for ${url}...`);
      const primaryCrawler = await getCrawlProvider('jsdom');
      content = await primaryCrawler.fetchContent(url);

      // If jsdom fails, try Cheerio as fallback
      if (content.error) {
        console.log(`[CRAWL] jsdom failed, trying Cheerio fallback...`);
        const fallbackCrawler = await getCrawlProvider('cheerio');
        content = await fallbackCrawler.fetchContent(url);
      }
    } else {
      // jsdom mode
      const crawler = await getCrawlProvider('jsdom');
      content = await crawler.fetchContent(url);
    }

    if (content.error) {
      let errorReason = content.error;

      // Map common errors to user-friendly messages
      if (content.error.includes('ENOTFOUND') || content.error.includes('getaddrinfo')) {
        errorReason = 'Domain not found (DNS error)';
      } else if (content.error.includes('ECONNREFUSED')) {
        errorReason = 'Connection refused';
      } else if (content.error.includes('ETIMEDOUT') || content.error.includes('timeout')) {
        errorReason = 'Connection timeout';
      } else if (content.error.includes('404')) {
        errorReason = 'Page not found (404)';
      } else if (
        content.error.includes('Canvas') ||
        content.error.includes('Image is not a constructor')
      ) {
        errorReason = 'Page contains unsupported elements (Canvas/complex graphics) - try a simpler page';
      } else if (content.error.includes('timeout')) {
        errorReason = 'Page took too long to load';
      }

      return NextResponse.json(
        {
          success: false,
          error: 'URL is not accessible',
          reason: errorReason,
          url,
          statusCode: content.statusCode || 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      content: {
        url: content.url,
        title: content.title,
        description: content.description,
        bodyText: content.bodyText,
        headings: content.headings,
        author: content.author,
        publishedDate: content.publishedDate,
        imageUrl: content.imageUrl,
      },
    });
  } catch (error) {
    console.error('[API] Fetch content error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content', message: (error as Error).message },
      { status: 500 }
    );
  }
}
