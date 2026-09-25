// Mock search crawl provider — returns fixture data for demo/testing

import { SearchCrawlProvider, CrawledContent } from './index';

export class MockSearchCrawl implements SearchCrawlProvider {
  private fixtures: Record<string, CrawledContent> = {
    'https://codewave.com/insights/': {
      url: 'https://codewave.com/insights/',
      title: 'Building Customer-First Platforms',
      description: 'How to build platforms that put customers first',
      content: `Codewave believes in building customer-first, transparent platforms. We focus on creating
        technical solutions that are actionable and evidence-based. Our approach to software development
        emphasizes clear communication and specific examples.`,
      bodyText: `Building Customer-First Platforms. Codewave believes in building customer-first,
        transparent platforms. We focus on creating technical solutions that are actionable and
        evidence-based. Our approach to software development emphasizes clear communication and
        specific examples. Every feature we ship is guided by customer feedback and data.`,
      headings: ['Building Customer-First Platforms', 'Our Philosophy', 'Technical Excellence'],
      author: 'Codewave Team',
      publishedDate: '2024-09-01',
      metadata: {
        'og:type': 'article',
        'article:published_time': '2024-09-01',
      },
      statusCode: 200,
    },
    'https://example.com/blog/api-design': {
      url: 'https://example.com/blog/api-design',
      title: 'RESTful API Design Best Practices',
      description: 'Learn how to design robust and customer-friendly APIs',
      content: `RESTful APIs require careful planning and transparent documentation. This article covers
        actionable best practices with specific examples. We discuss technical considerations and
        evidence-based approaches to API versioning.`,
      bodyText: `RESTful API Design Best Practices. RESTful APIs require careful planning and
        transparent documentation. This article covers actionable best practices with specific examples.
        We discuss technical considerations and evidence-based approaches to API versioning and
        backward compatibility.`,
      headings: ['RESTful API Design Best Practices', 'Core Principles', 'Implementation'],
      author: 'John Developer',
      publishedDate: '2024-08-15',
      metadata: {
        'og:type': 'article',
      },
      statusCode: 200,
    },
    'https://blog.example.com/generic-post': {
      url: 'https://blog.example.com/generic-post',
      title: 'Some Thoughts on Technology',
      description: 'Generic thoughts about technology',
      content: `This is vague and generic content. We talk about technology in general terms without
        specific examples. The jargon here is complex and not well explained.`,
      bodyText: `Some Thoughts on Technology. This is vague and generic content. We talk about
        technology in general terms without specific examples. The jargon here is complex and not
        well explained. Contains spam-like language.`,
      headings: ['Some Thoughts on Technology'],
      publishedDate: '2024-08-01',
      metadata: {},
      statusCode: 200,
    },
  };

  async fetchContent(url: string): Promise<CrawledContent> {
    // Check if fixture exists for this exact URL
    if (this.fixtures[url]) {
      return this.fixtures[url];
    }

    // Return fixture for domain if URL partially matches
    for (const [fixtureUrl, data] of Object.entries(this.fixtures)) {
      if (url.includes(new URL(fixtureUrl).hostname)) {
        return { ...data, url }; // Return with requested URL
      }
    }

    // Default fixture for unknown URLs
    return {
      url,
      title: 'Generic Article Title',
      description: 'A generic article',
      content: 'This is generic content about a topic.',
      bodyText: 'This is generic content about a topic.',
      headings: ['Generic Article Title'],
      metadata: {},
      statusCode: 200,
    };
  }
}
