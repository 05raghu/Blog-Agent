// ImageModelProvider interface — pluggable image generation abstraction
// Supports live (OpenAI DALL-E, etc.) and mock implementations

export interface ImageGenerationParams {
  title: string;
  brief?: string;
  outline?: string;
  style?: string; // Style preference: 'professional', 'creative', 'minimal', etc.
}

export interface GeneratedImage {
  url: string; // Data URI or actual image URL
  prompt: string; // The prompt used to generate this image
  alt: string; // Alt text for accessibility
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
}

export interface ImageModelProvider {
  generateImages(params: ImageGenerationParams): Promise<ImageGenerationResult>;
}

export { MockImageModel } from './mock';
export { OpenAIImageModel } from './openai';
export { AnthropicImageModel } from './anthropic';
