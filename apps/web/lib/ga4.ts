// GA4 provider — auto-selects between real GA4 API and mock

import { GoogleAnalytics4 } from '@blog-agent/integrations/ga4/google-analytics';
import { MockGA4 } from '@blog-agent/integrations/ga4/mock';
import type { GA4Provider } from '@blog-agent/integrations/ga4';

let ga4Provider: GA4Provider | null = null;

export async function getGA4Provider(): Promise<GA4Provider> {
  if (ga4Provider) {
    return ga4Provider;
  }

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const propertyId = process.env.GA4_PROPERTY_ID;

  // Use real GA4 if credentials available
  if (serviceAccountJson && propertyId) {
    console.log('[GA4] Using real Google Analytics 4 API');
    try {
      ga4Provider = new GoogleAnalytics4(serviceAccountJson, propertyId);
      return ga4Provider;
    } catch (error) {
      console.warn('[GA4] Real GA4 initialization failed, falling back to mock:', error);
    }
  }

  // Fallback to mock
  console.log('[GA4] Using mock GA4 provider (no credentials)');
  ga4Provider = new MockGA4();
  return ga4Provider;
}
