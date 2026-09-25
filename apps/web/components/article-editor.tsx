'use client';

import { useState, useEffect } from 'react';

interface ArticleEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function ArticleEditor({
  initialContent = '',
  onChange,
  onSave,
  isSaving = false,
}: ArticleEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(initialContent.split(/\s+/).filter(w => w.length > 0).length);

  // Sync content when initialContent prop changes
  useEffect(() => {
    setContent(initialContent);
    const words = initialContent.split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, [initialContent]);

  const handleChange = (newContent: string) => {
    setContent(newContent);
    onChange(newContent);
    const words = newContent.split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const insertMarkdown = (markdown: string, placeholder?: string) => {
    const textarea = document.getElementById('article-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    let newContent: string;
    if (selected) {
      newContent = before + markdown.replace(placeholder || '{}', selected) + after;
    } else {
      newContent = before + markdown + after;
    }

    handleChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + markdown.length - (placeholder ? placeholder.length : 0);
      textarea.selectionEnd = textarea.selectionStart;
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => insertMarkdown('# ', '#')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-all"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertMarkdown('## ', '##')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-all"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertMarkdown('### ', '###')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium transition-all"
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px bg-slate-300" />

          <button
            onClick={() => insertMarkdown('**{}**', '{}')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold transition-all"
            title="Bold"
          >
            B
          </button>
          <button
            onClick={() => insertMarkdown('*{}*', '{}')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm italic transition-all"
            title="Italic"
          >
            I
          </button>
          <button
            onClick={() => insertMarkdown('`{}`', '{}')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono transition-all"
            title="Code"
          >
            {'<>'}
          </button>

          <div className="w-px bg-slate-300" />

          <button
            onClick={() => insertMarkdown('- {}', '{}')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm transition-all"
            title="Bullet list"
          >
            • List
          </button>
          <button
            onClick={() => insertMarkdown('> {}', '{}')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm transition-all"
            title="Quote"
          >
            " Quote
          </button>
          <button
            onClick={() => insertMarkdown('[link](url)', 'url')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm transition-all"
            title="Link"
          >
            🔗 Link
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <textarea
          id="article-content"
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your article here... (Supports Markdown)"
          className="w-full h-96 px-4 py-3 border border-slate-300 rounded text-sm font-mono resize-none focus:ring-2 focus:ring-signal focus:border-transparent"
        />

        {/* Word count & Save */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">
            {wordCount} words
          </p>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              '💾 Save Draft'
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-bold text-slate-900 mb-4">Preview</h3>
        <div className="max-w-none">
          {(() => {
            // Render text with bare URLs as clickable hyperlinks
            const renderLinksAndText = (text: string): (string | JSX.Element)[] => {
              const parts: (string | JSX.Element)[] = [];
              let lastIndex = 0;

              // Match bare URLs: https://... or http://...
              const urlRegex = /https?:\/\/[^\s)]+/g;
              let urlMatch;

              while ((urlMatch = urlRegex.exec(text)) !== null) {
                // Add text before URL
                if (urlMatch.index > lastIndex) {
                  parts.push(text.substring(lastIndex, urlMatch.index));
                }

                let finalUrl = urlMatch[0].trim();

                // Remove trailing punctuation if present
                finalUrl = finalUrl.replace(/[.,;:!?)]+$/, '');

                console.log(`[Preview Link] URL: "${finalUrl}"`);

                parts.push(
                  <a
                    key={`url-${urlMatch.index}`}
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    onClick={() => {
                      console.log(`[Clicked] Opening: ${finalUrl}`);
                    }}
                  >
                    {finalUrl.length > 60 ? finalUrl.substring(0, 57) + '...' : finalUrl}
                  </a>
                );

                lastIndex = urlRegex.lastIndex;
              }

              // Add remaining text
              if (lastIndex < text.length) {
                parts.push(text.substring(lastIndex));
              }

              return parts.length > 0 ? parts : [text];
            };

            return content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('# ')) {
                return <h1 key={idx} className="text-3xl font-bold mt-4 mb-2" style={{fontWeight: '700'}}>{renderLinksAndText(paragraph.slice(2))}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={idx} className="text-2xl font-bold mt-3 mb-2" style={{fontWeight: '700'}}>{renderLinksAndText(paragraph.slice(3))}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={idx} className="text-xl font-bold mt-2 mb-1" style={{fontWeight: '700'}}>{renderLinksAndText(paragraph.slice(4))}</h3>;
              }
              if (paragraph.startsWith('---')) {
                return <hr key={idx} className="my-4 border-slate-300" />;
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2" style={{fontWeight: '400'}}>
                    {renderLinksAndText(paragraph.slice(2))}
                  </blockquote>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={idx} className="list-disc list-inside my-2" style={{fontWeight: '400'}}>
                    {paragraph.split('\n').map((item, i) => (
                      <li key={i} style={{fontWeight: '400'}}>{renderLinksAndText(item.slice(2))}</li>
                    ))}
                  </ul>
                );
              }

              return <p key={idx} className="my-2 leading-relaxed text-slate-700" style={{fontWeight: '400'}}>{renderLinksAndText(paragraph)}</p>;
            });
          })()}
        </div>
      </div>
    </div>
  );
}
