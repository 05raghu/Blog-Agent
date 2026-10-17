'use client';

interface GeneratedImage {
  url: string;
  prompt: string;
  alt: string;
}

interface ArticlePreviewProps {
  title: string;
  content: string;
  selectedImage?: GeneratedImage | null;
}

export function ArticlePreview({
  title,
  content,
  selectedImage,
}: ArticlePreviewProps) {
  // Convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Remove image prompts section and everything after it
    const imagePromptsIndex = html.indexOf('**Image Prompts (for your reference):**');
    if (imagePromptsIndex !== -1) {
      html = html.substring(0, imagePromptsIndex);
    }

    // Remove horizontal rules
    html = html.replace(/^---\s*$/gm, '');
    html = html.trim();

    // Convert headings (must be done before bold/italic to avoid conflicts)
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert numbered lists
    html = html.replace(/^\d+\. (.*?)$/gm, (match, item) => {
      return `<li>${item}</li>`;
    });

    // Wrap consecutive list items in <ol>
    html = html.replace(/(<li>.*?<\/li>)/s, (match) => {
      const items = match.match(/<li>.*?<\/li>/g) || [];
      if (items.length > 0) {
        return `<ol>${items.join('')}</ol>`;
      }
      return match;
    });

    // Convert unordered lists (- or *)
    html = html.replace(/^[*-] (.*?)$/gm, '<li>$1</li>');

    // Wrap consecutive bullet items in <ul>
    html = html.replace(/(<li>.*?<\/li>)/s, (match) => {
      const items = match.match(/<li>.*?<\/li>/g) || [];
      if (items.length > 0 && !match.includes('<ol>')) {
        return `<ul>${items.join('')}</ul>`;
      }
      return match;
    });

    // Convert line breaks to paragraphs
    const paragraphs = html.split('\n\n').filter(p => p.trim());
    html = paragraphs.map(p => {
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol')) {
        return p;
      }
      return `<p>${p}</p>`;
    }).join('\n');

    return html;
  };

  const htmlContent = markdownToHtml(content);

  return (
    <div className="space-y-8">
      {/* Article Preview Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Featured Image */}
        {selectedImage && (
          <div className="w-full h-96 bg-slate-100 rounded-t-lg overflow-hidden flex items-center justify-center">
            <img
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="p-8 lg:p-12 prose prose-sm max-w-none">
          {/* Title */}
          <h1 className="text-4xl font-bold text-slate-900 mb-6 mt-0">
            {title}
          </h1>

          {/* Article Body */}
          <div
            className="text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: htmlContent,
            }}
            style={{
              '--tw-prose-body': '#374151',
              '--tw-prose-headings': '#111827',
              '--tw-prose-lead': '#4B5563',
              '--tw-prose-links': '#0891b2',
              '--tw-prose-bold': '#111827',
              '--tw-prose-counters': '#6B7280',
              '--tw-prose-bullets': '#D1D5DB',
              '--tw-prose-hr': '#E5E7EB',
              '--tw-prose-quotes': '#111827',
              '--tw-prose-quote-borders': '#E5E7EB',
              '--tw-prose-captions': '#6B7280',
              '--tw-prose-kbd': '#111827',
              '--tw-prose-kbd-shadows': 'rgb(17 24 39 / 0.1)',
              '--tw-prose-code': '#D946EF',
              '--tw-prose-pre-bg': '#1F2937',
              '--tw-prose-pre-code': '#E5E7EB',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Preview Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        ℹ️ This is how your article will appear to readers. All formatting has been applied and internal prompts have been removed.
      </div>
    </div>
  );
}
