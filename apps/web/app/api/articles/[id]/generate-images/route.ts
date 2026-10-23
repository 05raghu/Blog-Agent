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

  return prompts;
}

export async function POST(request: NextRequest) {
  const debug: any = { steps: [] };
  
  try {
    const body = await request.json();
    const { title, content, style } = body;

    debug.steps.push('request_received');
    debug.title = title ? title.substring(0, 50) : 'MISSING';
    debug.contentLength = content?.length || 0;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required', debug },
        { status: 400 }
      );
    }

    // Try to extract image prompts from content first
    let imagePrompts: string[] = [];

    if (content) {
      imagePrompts = extractImagePromptsFromContent(content);
      debug.steps.push('prompts_extracted');
      debug.extractedPromptsCount = imagePrompts.length;
    }

    // If no prompts found in content, generate them from title/brief/outline
    if (imagePrompts.length === 0) {
      imagePrompts = [
        `Professional illustration for article: ${title}. High quality, suitable for business blog post.`,
        `Creative visual representation of: ${title}. Modern, eye-catching design.`,
        `Conceptual illustration about ${title}. Abstract, professional style.`,
      ];
      debug.steps.push('fallback_prompts_generated');
      debug.fallbackPromptsCount = imagePrompts.length;
    }

    debug.totalPrompts = imagePrompts.length;

    // Get providers
    let provider;
    try {
      provider = await getImageModelProvider();
      debug.steps.push('image_provider_obtained');
      debug.imageProvider = provider?.constructor?.name || 'UNKNOWN';
    } catch (err) {
      debug.steps.push('image_provider_error');
      debug.imageProviderError = String(err);
      return NextResponse.json({ images: [], debug }, { status: 200 });
    }

    // Behavior rotation: collapse → entangle → interfere
    const behaviors: Array<'collapse' | 'entangle' | 'interfere'> = ['collapse', 'entangle', 'interfere'];

    // Generate one image per prompt, with LLM-crafted brand-compliant prompts
    const imageResults = await Promise.all(
      imagePrompts.map(async (prompt, idx) => {
        try {
          const behavior = behaviors[idx] || 'collapse';
          
          // Step 1: Craft a brand-compliant image prompt via LLM
          let textProvider;
          try {
            textProvider = await getTextModelProvider();
            debug.steps.push(`text_provider_${idx}_obtained`);
          } catch (err) {
            debug.steps.push(`text_provider_${idx}_error`);
            return null;
          }

          let brandedPrompt;
          try {
            brandedPrompt = await textProvider.craftBrandedImagePrompt({
              title,
              topicContext: prompt,
              behavior,
            });
            debug.steps.push(`branded_prompt_${idx}_crafted`);
          } catch (err) {
            debug.steps.push(`branded_prompt_${idx}_error`);
            debug[`brandedPromptError_${idx}`] = String(err);
            return null;
          }

          // Step 2: Generate image using the branded prompt
          try {
            const result = await provider.generateImages({
              title,
              brief: brandedPrompt,
              outline: '',
              style: style || 'professional',
            });

            if (result.images && result.images.length > 0) {
              debug.steps.push(`image_${idx}_generated`);
              return result.images[0];
            }
            debug.steps.push(`image_${idx}_no_results`);
            return null;
          } catch (err) {
            debug.steps.push(`image_${idx}_generation_error`);
            debug[`imageGenError_${idx}`] = String(err);
            return null;
          }
        } catch (err) {
          debug.steps.push(`image_${idx}_outer_error`);
          return null;
        }
      })
    );

    debug.steps.push('all_images_processed');
    debug.generatedImagesCount = imageResults.filter((img) => img !== null).length;

    const result = {
      images: imageResults.filter((img) => img !== null),
      debug,
    };

    return NextResponse.json(result);
  } catch (error) {
    debug.steps.push('top_level_error');
    debug.topLevelError = String(error);

    return NextResponse.json(
      {
        error: 'Failed to generate images',
        debug,
      },
      { status: 500 }
    );
  }
}
