// Anthropic ImageModel implementation — Note: Claude cannot generate images
// Falls back to mock implementation for demo/testing

import { ImageModelProvider, ImageGenerationParams, ImageGenerationResult } from './index';
import { MockImageModel } from './mock';

export class AnthropicImageModel implements ImageModelProvider {
  private mockModel = new MockImageModel();

  async generateImages(params: ImageGenerationParams): Promise<ImageGenerationResult> {
    // Claude API does not support image generation (as of knowledge cutoff)
    // Fall back to mock implementation
    console.warn('[ImageModel] Anthropic does not support image generation. Using mock implementation.');
    return this.mockModel.generateImages(params);
  }
}
