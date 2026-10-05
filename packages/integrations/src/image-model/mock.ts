// Mock ImageModel implementation — generates deterministic placeholder images for testing/demo

import { ImageModelProvider, ImageGenerationParams, ImageGenerationResult, GeneratedImage } from './index';

export class MockImageModel implements ImageModelProvider {
  async generateImages(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    console.log('[MockImageModel] generateImages called with title:', params.title?.substring(0, 50));
    try {
      // Generate simple SVG placeholders with content-aware text
      const titleWords = params.title.toLowerCase().split(' ');
      const mainWord = titleWords[0] || 'article';
      console.log('[MockImageModel] Main word extracted:', mainWord);

      const images: GeneratedImage[] = [];

      // Image 1: Professional
      console.log('[MockImageModel] STEP 1: Generating professional image...');
      try {
        const url = this.generateSVGPlaceholder(
          `Professional illustration about ${mainWord}`,
          '#3b82f6'
        );
        console.log('[MockImageModel] STEP 1: URL generated, length:', url?.length || 'UNDEFINED');

        if (!url) {
          throw new Error('URL is null or undefined');
        }

        const imageObj = {
          url,
          prompt: `Professional, modern illustration about ${params.title}. High quality, clean design, suitable for business blog post.`,
          alt: `Illustration for article: ${params.title}`,
        };
        console.log('[MockImageModel] STEP 1: Image object created');
        images.push(imageObj);
        console.log('[MockImageModel] STEP 1: ✓ Image added to array. Array length now:', images.length);
      } catch (e) {
        console.error('[MockImageModel] STEP 1: ✗ FAILED:', e instanceof Error ? e.message : String(e));
      }

      // Image 2: Conceptual
      console.log('[MockImageModel] STEP 2: Generating conceptual image...');
      try {
        const url = this.generateSVGPlaceholder(
          `Conceptual image for ${mainWord}`,
          '#8b5cf6'
        );
        console.log('[MockImageModel] STEP 2: URL generated, length:', url?.length || 'UNDEFINED');

        if (!url) {
          throw new Error('URL is null or undefined');
        }

        images.push({
          url,
          prompt: `Conceptual and creative visual representation of ${params.title}. Abstract, modern style.`,
          alt: `Conceptual image for ${params.title}`,
        });
        console.log('[MockImageModel] STEP 2: ✓ Image added. Array length now:', images.length);
      } catch (e) {
        console.error('[MockImageModel] STEP 2: ✗ FAILED:', e instanceof Error ? e.message : String(e));
      }

      // Image 3: Data visualization
      console.log('[MockImageModel] STEP 3: Generating data visualization image...');
      try {
        const url = this.generateSVGPlaceholder(
          `Data visualization for ${mainWord}`,
          '#ec4899'
        );
        console.log('[MockImageModel] STEP 3: URL generated, length:', url?.length || 'UNDEFINED');

        if (!url) {
          throw new Error('URL is null or undefined');
        }

        images.push({
          url,
          prompt: `Data-driven visual, infographic style, about ${params.title}. Clean, professional, perfect for explaining concepts.`,
          alt: `Data visualization for ${params.title}`,
        });
        console.log('[MockImageModel] STEP 3: ✓ Image added. Array length now:', images.length);
      } catch (e) {
        console.error('[MockImageModel] STEP 3: ✗ FAILED:', e instanceof Error ? e.message : String(e));
      }

      console.log('[MockImageModel] ✓✓✓ Generated', images.length, 'images total');
      console.log('[MockImageModel] Returning result with', images.length, 'images');
      return { images };
    } catch (error) {
      console.error('[MockImageModel] ✗✗✗ Error in generateImages:', error);
      console.error('[MockImageModel] Error details:', error instanceof Error ? error.message : String(error));
      return { images: [] };
    }
  }

  private generateSVGPlaceholder(text: string, bgColor: string): string {
    // Create a simple placeholder image URL
    // Using a simple color + text as data URI

    // Simple SVG that works in all environments
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="${bgColor}"/>
      <text x="600" y="315" font-size="48" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">
        ${text}
      </text>
      <text x="600" y="535" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="Arial, sans-serif">
        Mock Image
      </text>
    </svg>`;

    try {
      // Create a proper data URI with the SVG content
      const encoded = Buffer.from(svg).toString('base64');
      const dataUrl = `data:image/svg+xml;base64,${encoded}`;
      console.log('[MockImageModel] Generated SVG data URL, length:', dataUrl.length);
      return dataUrl;
    } catch (error) {
      console.error('[MockImageModel] Failed to generate SVG:', error);
      // Return a simple fallback color
      return `data:image/svg+xml,<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect fill="${bgColor}" width="1200" height="630"/></svg>`;
    }
  }
}
