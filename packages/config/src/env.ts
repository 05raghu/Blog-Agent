import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),

  // Integration modes (mock|live)
  TEXT_MODEL_MODE: z.enum(['mock', 'live']).default('mock'),
  IMAGE_MODEL_MODE: z.enum(['mock', 'live']).default('mock'),
  SEARCH_CRAWL_MODE: z.enum(['mock', 'live']).default('mock'),
  WORDPRESS_MODE: z.enum(['mock', 'live']).default('mock'),
  GA4_MODE: z.enum(['mock', 'live']).default('mock'),
  GSC_MODE: z.enum(['mock', 'live']).default('mock'),
  FORM_WEBHOOK_MODE: z.enum(['mock', 'live']).default('mock'),

  // Live credentials (optional, only if mode is live)
  ANTHROPIC_API_KEY: z.string().optional(),
  IMAGE_MODEL_API_KEY: z.string().optional(),
  IMAGE_MODEL_ENDPOINT: z.string().url().optional(),
  SEARCH_CRAWL_API_KEY: z.string().optional(),
  SEARCH_CRAWL_ENDPOINT: z.string().url().optional(),
  WORDPRESS_SITE_URL: z.string().url().optional(),
  WORDPRESS_REST_USERNAME: z.string().optional(),
  WORDPRESS_REST_PASSWORD: z.string().optional(),
  GA4_PROPERTY_ID: z.string().optional(),
  GA4_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GSC_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FORM_WEBHOOK_SHARED_SECRET: z.string().optional(),
  FORM_SUBMISSION_ENDPOINT: z.string().url().optional(),

  // App config
  APP_URL: z.string().url().default('http://localhost:3000'),
  WORKER_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function getEnv(): EnvConfig {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,

    TEXT_MODEL_MODE: process.env.TEXT_MODEL_MODE,
    IMAGE_MODEL_MODE: process.env.IMAGE_MODEL_MODE,
    SEARCH_CRAWL_MODE: process.env.SEARCH_CRAWL_MODE,
    WORDPRESS_MODE: process.env.WORDPRESS_MODE,
    GA4_MODE: process.env.GA4_MODE,
    GSC_MODE: process.env.GSC_MODE,
    FORM_WEBHOOK_MODE: process.env.FORM_WEBHOOK_MODE,

    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    IMAGE_MODEL_API_KEY: process.env.IMAGE_MODEL_API_KEY,
    IMAGE_MODEL_ENDPOINT: process.env.IMAGE_MODEL_ENDPOINT,
    SEARCH_CRAWL_API_KEY: process.env.SEARCH_CRAWL_API_KEY,
    SEARCH_CRAWL_ENDPOINT: process.env.SEARCH_CRAWL_ENDPOINT,
    WORDPRESS_SITE_URL: process.env.WORDPRESS_SITE_URL,
    WORDPRESS_REST_USERNAME: process.env.WORDPRESS_REST_USERNAME,
    WORDPRESS_REST_PASSWORD: process.env.WORDPRESS_REST_PASSWORD,
    GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID,
    GA4_SERVICE_ACCOUNT_JSON: process.env.GA4_SERVICE_ACCOUNT_JSON,
    GSC_SERVICE_ACCOUNT_JSON: process.env.GSC_SERVICE_ACCOUNT_JSON,
    FORM_WEBHOOK_SHARED_SECRET: process.env.FORM_WEBHOOK_SHARED_SECRET,
    FORM_SUBMISSION_ENDPOINT: process.env.FORM_SUBMISSION_ENDPOINT,

    APP_URL: process.env.APP_URL,
    WORKER_ENABLED: process.env.WORKER_ENABLED,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  };

  return envSchema.parse(env);
}

// Initialize config on import
let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = getEnv();
  }
  return cachedConfig;
}

export const config = getConfig();
