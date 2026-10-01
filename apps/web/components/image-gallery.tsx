'use client';

import { useState, useEffect } from 'react';

interface GeneratedImage {
  url: string;
  prompt: string;
  alt: string;
}

interface ImageGalleryProps {
  title: string;
  brief?: string;
  outline?: string;
  onGenerate: () => Promise<void>;
  onSelect?: (image: GeneratedImage | null) => Promise<void>;
  isLoading?: boolean;
  images?: GeneratedImage[];
  selectedImage?: GeneratedImage | null;
}

export function ImageGallery({
  title,
  brief: _brief,
  outline: _outline,
  onGenerate,
  onSelect,
  isLoading = false,
  images = [],
  selectedImage: selectedImageFromProps = null,
}: ImageGalleryProps) {
  const [showGallery, setShowGallery] = useState(images.length > 0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(() => {
    if (!selectedImageFromProps || images.length === 0) return null;
    const idx = images.findIndex(img => img.url === selectedImageFromProps.url);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (images.length > 0) {
      setShowGallery(true);
    }
  }, [images]);

  useEffect(() => {
    if (selectedImageFromProps && images.length > 0) {
      const idx = images.findIndex(img => img.url === selectedImageFromProps.url);
      setSelectedIndex(idx >= 0 ? idx : null);
    }
  }, [selectedImageFromProps, images]);

  const handleGenerate = async () => {
    setShowGallery(true);
    await onGenerate();
  };

  const handleSelectImage = async (idx: number) => {
    const isCurrentlySelected = selectedIndex === idx;
    const newIndex = isCurrentlySelected ? null : idx;
    setSelectedIndex(newIndex);

    if (onSelect) {
      const selectedImg = newIndex !== null ? images[newIndex] : null;
      await onSelect(selectedImg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      {images.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-slate-600 mb-4">
            Generate AI-powered hero images optimized for your article. Choose from multiple options and select your favorite.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Images...
              </>
            ) : (
              '🎨 Generate Images'
            )}
          </button>
        </div>
      )}

      {/* Images Gallery */}
      {showGallery && images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Generated Images</h3>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-sm px-3 py-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              🔄 Regenerate
            </button>
          </div>

          <div className="space-y-4">
            {images.map((image, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 cursor-pointer transition-colors overflow-hidden ${
                  selectedIndex === idx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => handleSelectImage(idx)}
              >
                <div className="flex gap-4">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-40 h-40 object-cover rounded border border-slate-300"
                    />
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Image {idx + 1}</p>
                      <p className="text-xs text-slate-600 mb-3">
                        <span className="font-medium">Prompt:</span> {image.prompt}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-medium">Alt text:</span> {image.alt}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className="mt-3">
                      <input
                        type="checkbox"
                        checked={selectedIndex === idx}
                        onChange={() => handleSelectImage(idx)}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-slate-600 ml-2">
                        {selectedIndex === idx ? 'Selected as hero image' : 'Click to select as hero image'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          {selectedIndex !== null && selectedIndex >= 0 && images[selectedIndex] && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800">
                ✓ Hero Image Selected
              </p>
              <p className="text-xs text-green-700 mt-1">
                This image will be used as the hero/featured image for your article
              </p>
            </div>
          )}
        </div>
      )}

      {!isLoading && images.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <p className="text-slate-600">
            Click "Generate Images" to create AI-powered images for your article
          </p>
        </div>
      )}
    </div>
  );
}
