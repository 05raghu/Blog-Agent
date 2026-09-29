// API route: POST /api/articles/[id]/generate-images — Generate actual images for article
// Uses image prompts from the article content (generated during draft creation)
// Falls back to generating prompts from title/brief/outline if no prompts found in content

import { NextRequest, NextResponse } from 'next/server';
import { getImageModelProvider } from '@/lib/image-model';
import { getTextModelProvider } from '@/lib/text-model';

function extractImagePromptsFromContent(content: string): string[] {
  // Look for image prompts in the content
  // They're formatted as: **Image N - Type**: <detailed prompt>
  const promptRegex = /\*\*Image\s+\d+\s+-\s+[^*]+\*\*:\s+([^*]+?)(?=\*\*Image|\*\*\*|$)/g;

  const prompts: string[] = [];
  let match;

  while ((match = promptRegex.exec(content)) !== null) {
    const prompt = match[1].trim();
    if (prompt.length > 20) {
      // Clean up the prompt text
      const cleanedPrompt = prompt
        .replace(/\n\n/g, ' ')
        .replace(/\n/g, ' ')
        .trim();
      prompts.push(cleanedPrompt);
    }
  }

  console.log('[Extract] Found', prompts.length, 'image prompts in content');
  if (prompts.length > 0) {
    prompts.forEach((p, i) => {
      console.log(`[Extract] Prompt ${i + 1} (${p.length} chars):`, p.substring(0, 80) + '...');
    });
  }

  return prompts;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('\n=== [API] Generate Images Request Started ===');
  try {
    const body = await request.json();
    const { title, brief, outline, content, style } = body;

    console.log('[DEBUG-1] Raw request body keys:', Object.keys(body));
    console.log('[DEBUG-2] Title:', title ? `${title.substring(0, 50)}...` : 'MISSING');
    console.log('[DEBUG-3] Content length:', content?.length || 0);
    console.log('[DEBUG-4] Style:', style || 'NOT PROVIDED (will default to professional)');

    if (!title) {
      console.error('[ERROR] Title is required but was not provided');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Try to extract image prompts from content first
    console.log('[DEBUG-5] Checking for image prompts in content...');
    let imagePrompts: string[] = [];

    if (content) {
      imagePrompts = extractImagePromptsFromContent(content);
      console.log('[DEBUG-6] ✓ Extracted', imagePrompts.length, 'prompts from content');
    }

    // If no prompts found in content, generate them from title/brief/outline
    if (imagePrompts.length === 0) {
      console.log('[DEBUG-7] No prompts in content, generating from title/brief/outline...');
      imagePrompts = [
        `Professional illustration for article: ${title}. High quality, suitable for business blog post.`,
        `Creative visual representation of: ${title}. Modern, eye-catching design.`,
        `Conceptual illustration about ${title}. Abstract, professional style.`,
      ];
      console.log('[DEBUG-8] Generated', imagePrompts.length, 'default prompts');
    }

    console.log('[DEBUG-9] Getting image provider...');
    const provider = await getImageModelProvider();
    console.log('[DEBUG-10] ✓ Provider obtained:', provider?.constructor?.name || 'UNKNOWN');

    console.log('[DEBUG-11] Generating images from', imagePrompts.length, 'prompts...');

    // Generate one image per prompt
    const imageResults = await Promise.all(
      imagePrompts.map(async (prompt, idx) => {
        try {
          console.log(`[DEBUG-12.${idx}] Generating image ${idx + 1}...`);
          const result = await provider.generateImages({
            title,
            brief: prompt,
            outline: '',
            style: style || 'professional',
          });

          if (result.images && result.images.length > 0) {
            console.log(`[DEBUG-12.${idx}] ✓ Image ${idx + 1} generated`);
            return result.images[0];
          }
          return null;
        } catch (err) {
          console.error(`[DEBUG-12.${idx}] ✗ Failed to generate image ${idx + 1}:`, err);
          return null;
        }
      })
    );

    const result = {
      images: imageResults.filter((img) => img !== null),
    };

    console.log('[DEBUG-13] ✓ All images generated');
    console.log('[DEBUG-14] Result images count:', result.images?.length || 0);

    if (!result.images || result.images.length === 0) {
      console.warn('[WARN] No images generated!');
      console.warn('[WARN] Returning result:', JSON.stringify(result));
    } else {
      console.log('[SUCCESS] Generated', result.images.length, 'images');
      result.images.forEach((img, idx) => {
        console.log(`[IMAGE-${idx}] URL length: ${img.url?.length || 0}, prompt length: ${img.prompt?.length || 0}`);
      });
    }

    const response = NextResponse.json(result);
    console.log('[DEBUG-14] Response status:', response.status);
    console.log('=== [API] Generate Images Request Completed ===\n');
    return response;
  } catch (error) {
    console.error('[ERROR] Generate images failed:', error);
    console.error('[ERROR] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[ERROR] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'N/A');

    return NextResponse.json(
      {
        error: 'Failed to generate images',
        message: error instanceof Error ? error.message : String(error),
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
