// OpenAI ImageModel implementation — uses DALL-E API for image generation

import OpenAI from 'openai';
import { ImageModelProvider, ImageGenerationParams, ImageGenerationResult } from './index';

// Polyfill File API for Node.js if not available
if (typeof global !== 'undefined' && !global.File) {
  class File {
    constructor(public parts: any[], public name: string, public options?: any) {}
  }
  (global as any).File = File;
}

export class OpenAIImageModel implements ImageModelProvider {
  private client: OpenAI;
  private model = 'gpt-image-2.5-sunburst'; // Custom model available on this account

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateImages(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    // If brief is provided and looks like an explicit prompt (not context), use it directly
    // Otherwise generate 3 different image prompts from title/brief/outline
    const prompts = this.shouldUseDirectPrompt(params)
      ? this.createDirectPrompts(params)
      : this.generatePrompts(params);

    const images = await Promise.all(
      prompts.map(async (prompt) => {
        try {
          console.log('[OpenAI] Generating image with prompt:', prompt.prompt.substring(0, 80));
          const response = await this.client.images.generate({
            model: this.model,
            prompt: prompt.prompt,
            n: 1,
            size: '1024x1024',
            quality: 'high',
          });

          if (!response.data || response.data.length === 0) {
            throw new Error('No image data in response');
          }

          // Handle both URL and base64 response formats
          let imageUrl = response.data[0].url;
          if (!imageUrl && (response.data[0] as any).b64_json) {
            // Convert base64 to data URL
            imageUrl = `data:image/png;base64,${(response.data[0] as any).b64_json}`;
          }

          if (!imageUrl) {
            throw new Error('No image URL or base64 data in response');
          }

          return {
            url: imageUrl,
            prompt: prompt.prompt,
            alt: prompt.alt,
          };
        } catch (error) {
          console.error('[ImageModel] Failed to generate image:', error);
          // Return a fallback image on error
          return {
            url: '',
            prompt: prompt.prompt,
            alt: prompt.alt,
          };
        }
      })
    );

    // Filter out failed generations (empty URLs)
    return {
      images: images.filter((img) => img.url),
    };
  }

  private shouldUseDirectPrompt(params: ImageGenerationParams): boolean {
    // Use brief directly as a prompt if it's longer and more detailed than typical context
    // (Extracted prompts from content are typically 80+ chars with specific descriptions)
    return !!(params.brief && params.brief.length > 60 && params.brief.includes(' '));
  }

  private createDirectPrompts(
    params: ImageGenerationParams
  ): Array<{ prompt: string; alt: string }> {
    const { title, brief } = params;
    // Use the brief as-is (it's an extracted image prompt from content)
    return [
      {
        prompt: brief || `Professional blog image for article titled "${title}"`,
        alt: `Image for: ${title}`,
      },
    ];
  }

  private generatePrompts(
    params: ImageGenerationParams
  ): Array<{ prompt: string; alt: string }> {
    const { title, brief, outline, style = 'professional' } = params;

    return [
      {
        prompt: `Professional blog hero image for article titled "${title}". ${brief ? `Context: ${brief}` : ''} Style: modern, clean, ${style}. High quality, visually appealing, suitable for business/tech blog. 1024x1024 square format.`,
        alt: `Professional illustration for: ${title}`,
      },
      {
        prompt: `Creative and engaging visual representation of "${title}". ${outline ? `Topic outline: ${outline.substring(0, 200)}` : ''} Modern design, vibrant, eye-catching, suitable for article header. ${style} aesthetic. 1024x1024 format.`,
        alt: `Creative visual for: ${title}`,
      },
      {
        prompt: `Conceptual and abstract visualization for "${title}". Emphasize key ideas from: ${brief || 'professional content'}. Minimalist ${style} design, professional quality, suitable for thought leadership article. 1024x1024 dimensions.`,
        alt: `Conceptual image for: ${title}`,
      },
    ];
  }
}
