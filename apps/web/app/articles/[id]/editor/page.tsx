'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArticleEditor } from '@/components/article-editor';
import { BriefEditor } from '@/components/brief-editor';
import { PublishReadiness } from '@/components/publish-readiness';
import { StageWorkflow } from '@/components/stage-workflow';
import { SEOAnalyzer } from '@/components/seo-analyzer';
import { CrosslinkManager } from '@/components/crosslink-manager';
import { CTAGenerator } from '@/components/cta-generator';
import { ImageGallery } from '@/components/image-gallery';
import { validateTransition, type ArticleStage, STAGE_COLORS, STAGE_LABELS } from '@blog-agent/domain';

interface CTA {
  text: string;
  rationale: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  alt: string;
}

interface Article {
  id: string;
  contentId: string;
  title: string;
  brief: string;
  outline: string;
  content?: string;
  status: ArticleStage;
  topicId: string;
  strategyId: string;
  wordCount: number;
  linkedSources?: string[]; // Array of source IDs
  selectedCTA?: CTA; // Selected CTA for the article
  generatedCTAs?: CTA[]; // List of generated CTA suggestions
  selectedImage?: GeneratedImage; // Selected hero image
  generatedImages?: GeneratedImage[]; // List of generated images
  createdAt: string;
  updatedAt: string;
}

export default function ArticleEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const strategyId = searchParams?.get('strategyId') || '';

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  // Editor state
  const [brief, setBrief] = useState('');
  const [angle, setAngle] = useState('');
  const [audience, setAudience] = useState('');
  const [content, setContent] = useState('');
  const [outline, setOutline] = useState('');
  const [currentStage, setCurrentStage] = useState<ArticleStage>('NOT_STARTED');
  const [publishDate, setPublishDate] = useState('');
  const [editingPublishDate, setEditingPublishDate] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('default-workspace');

  // Sources state
  const [sources, setSources] = useState<any[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Record<string, boolean>>({});

  // SEO state
  const [seoScore, setSeoScore] = useState(0);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);

  // Cross-linking state
  const [crosslinks, setCrosslinks] = useState<any[]>([]);
  const [crosslinksLoading, setCrosslinksLoading] = useState(false);
  const [suggestedLinks, setSuggestedLinks] = useState<any[]>([]);

  // CTA state
  const [ctas, setCtas] = useState<any[]>([]);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [selectedCTA, setSelectedCTA] = useState<CTA | null>(null);

  // Image state
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'brief' | 'outline' | 'content' | 'seo' | 'crosslinks' | 'cta' | 'images' | 'score' | 'workflow' | 'sources'>('brief');

  // Initialize selected sources when article loads or when Sources tab is accessed
  useEffect(() => {
    if (article?.linkedSources && article.linkedSources.length > 0) {
      const linkedMap = article.linkedSources.reduce(
        (acc, sourceId) => ({ ...acc, [sourceId]: true }),
        {}
      );
      setSelectedSources(linkedMap);
    } else {
      setSelectedSources({});
    }
  }, [article?.linkedSources]);

  // Fetch sources when Sources tab is accessed
  useEffect(() => {
    if (activeTab === 'sources' && strategyId && article) {
      fetchSources();
      // Re-initialize selected sources when tab is accessed
      if (article.linkedSources && article.linkedSources.length > 0) {
        const linkedMap = article.linkedSources.reduce(
          (acc, sourceId) => ({ ...acc, [sourceId]: true }),
          {}
        );
        setSelectedSources(linkedMap);
      }
    }
  }, [activeTab, strategyId, article?.linkedSources]);

  const fetchSources = async () => {
    try {
      setSourcesLoading(true);
      const response = await fetch(`/api/knowledge/sources?strategyId=${strategyId}`);
      if (response.ok) {
        const data = await response.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleSEOAnalysis = async () => {
    try {
      setSeoLoading(true);
      console.log('[DEBUG] Starting SEO analysis...');

      const response = await fetch(`/api/articles/${id}/analyze-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article?.title,
          content,
          brief,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze SEO');

      const data = await response.json();
      console.log('[DEBUG] ✅ SEO analysis received:', data);
      setSeoAnalysis(data);
      setSeoScore(data.score);

      // Persist SEO analysis to backend
      console.log('[DEBUG] 💾 Saving to backend...');
      const saveResponse = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoScore: data.score,
          seoAnalysis: data,
        }),
      });

      console.log('[DEBUG] Save response status:', saveResponse.status);

      if (!saveResponse.ok) {
        console.error('[DEBUG] ❌ Failed to save SEO analysis', saveResponse.status);
        throw new Error(`Save failed: ${saveResponse.status}`);
      }

      const savedData = await saveResponse.json();
      console.log('[DEBUG] ✅ SEO analysis saved! Backend returned:', savedData.seoAnalysis ? 'HAS DATA' : 'NO DATA');
    } catch (err) {
      console.error('[DEBUG] ❌ Error in handleSEOAnalysis:', err);
      setError((err as Error).message);
    } finally {
      setSeoLoading(false);
    }
  };

  const handleSuggestLinks = async () => {
    try {
      setCrosslinksLoading(true);
      const response = await fetch(`/api/articles/${id}/suggest-internal-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article?.title,
          content,
          strategyId,
        }),
      });

      if (!response.ok) throw new Error('Failed to suggest links');

      const data = await response.json();
      setSuggestedLinks(data.suggestions || []);

      // Auto-detect which links are already in content
      const approvedLinks: Record<string, boolean> = {};
      (data.suggestions || []).forEach((link: any) => {
        if (content.includes(`/articles/${link.id}`)) {
          approvedLinks[link.id] = true;
        }
      });

      // Store approved state in localStorage so it persists
      if (Object.keys(approvedLinks).length > 0) {
        localStorage.setItem(`crosslinks_${id}`, JSON.stringify(approvedLinks));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCrosslinksLoading(false);
    }
  };

  const handleGenerateCTA = async () => {
    try {
      setCtaLoading(true);
      const response = await fetch(`/api/articles/${id}/generate-cta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article?.title,
          content,
          brief,
          targetAudience: audience,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate CTA');

      const data = await response.json();
      const generatedCtas = data.ctas || [];
      setCtas(generatedCtas);

      // Save generated CTAs to backend for persistence
      const saveResponse = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedCTAs: generatedCtas,
        }),
      });

      if (!saveResponse.ok) {
        console.error('[DEBUG] Failed to save generated CTAs');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCtaLoading(false);
    }
  };

  const handleSelectCTA = async (cta: CTA | null) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCTA: cta,
        }),
      });

      if (!response.ok) throw new Error('Failed to save CTA selection');

      const data = await response.json();
      setArticle(data);
      setSelectedCTA(cta);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setError((err as Error).message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateImages = async () => {
    try {
      setImagesLoading(true);
      console.log('[Editor] Generating images...');
      const response = await fetch(`/api/articles/${id}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article?.title,
          brief,
          outline,
          content, // Pass content so API can extract image prompts
          style: 'professional',
        }),
      });

      if (!response.ok) throw new Error('Failed to generate images');

      const data = await response.json();
      const generatedImages = data.images || [];
      setImages(generatedImages);
      console.log('[Editor] ✓ Generated', generatedImages.length, 'images');

      // Note: We don't persist full image data to avoid payload size limits
      // Images can be regenerated anytime by clicking "Regenerate"
      // Only the selectedImage is persisted to the backend
    } catch (err) {
      setError((err as Error).message);
      console.error('[ERROR] Image generation failed:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleSelectImage = async (image: GeneratedImage | null) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedImage: image,
        }),
      });

      if (!response.ok) throw new Error('Failed to save image selection');

      const data = await response.json();
      setArticle(data);
      setSelectedImage(image);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setError((err as Error).message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSources = async () => {
    try {
      setSaving(true);
      const allSelectedIds = Object.entries(selectedSources)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      const response = await fetch(`/api/articles/${id}/link-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceIds: allSelectedIds }),
      });

      if (!response.ok) throw new Error('Failed to link sources');

      // Update article with linked sources
      setArticle((prev) => prev ? { ...prev, linkedSources: allSelectedIds } : null);

      // Clear only newly selected sources (keep all linked ones checked as disabled)
      const newlyLinked = allSelectedIds.filter(
        (id) => !(article?.linkedSources?.includes(id) || false)
      );
      const remainingSelected = allSelectedIds.reduce(
        (acc, id) => ({ ...acc, [id]: true }),
        {}
      );
      setSelectedSources(remainingSelected);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setError((err as Error).message);
      console.error('Failed to link sources:', err);
    } finally {
      setSaving(false);
    }
  };

  // Show save status briefly
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Auto-save content when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content && content !== article?.content) {
        handleSave('content', content);
      }
    }, 2000); // Save 2 seconds after user stops typing

    return () => clearTimeout(timer);
  }, [content]);

  // Auto-save outline when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (outline && outline !== article?.outline) {
        handleSave('outline', outline);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [outline]);

  // Auto-scroll to top when error appears
  useEffect(() => {
    if (error) {
      console.log('[ERROR]', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-save brief when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (brief && brief !== article?.brief) {
        handleSave('brief', brief);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [brief]);

  // Auto-analyze SEO when content is available
  useEffect(() => {
    if (activeTab === 'seo' && content && !seoAnalysis && !seoLoading) {
      handleSEOAnalysis();
    }
  }, [activeTab, content]);

  // Auto-suggest cross-links when tab is accessed
  useEffect(() => {
    if (activeTab === 'crosslinks' && content && suggestedLinks.length === 0 && !crosslinksLoading) {
      handleSuggestLinks();
    }
  }, [activeTab, content]);

  // Auto-generate CTAs when tab is accessed (only if no CTAs exist and no CTA selected)
  useEffect(() => {
    if (activeTab === 'cta' && content && ctas.length === 0 && !selectedCTA && !ctaLoading) {
      handleGenerateCTA();
    }
  }, [activeTab, content, selectedCTA]);

  // Auto-generate images when tab is accessed (only if no images exist and no image selected)
  useEffect(() => {
    if (activeTab === 'images' && article?.title && images.length === 0 && !selectedImage && !imagesLoading) {
      handleGenerateImages();
    }
  }, [activeTab, article?.title, selectedImage]);

  useEffect(() => {
    if (id) fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      if (!response.ok) throw new Error('Article not found');

      const data = await response.json();
      setArticle(data);
      setBrief(data.brief || '');
      setAngle(data.angle || '');
      setAudience(data.targetAudience || '');
      setContent(data.content || '');
      setOutline(data.outline || '');
      setCurrentStage(data.status || 'NOT_STARTED');
      setPublishDate(data.plannedPublishDate || '');

      // Load persisted SEO analysis if available
      if (data.seoAnalysis) {
        console.log('[DEBUG] Loading persisted SEO analysis:', data.seoAnalysis);
        setSeoAnalysis(data.seoAnalysis);
        setSeoScore(data.seoScore || 0);
      } else {
        console.log('[DEBUG] No persisted SEO analysis found');
      }

      // Load persisted CTA if available
      if (data.selectedCTA) {
        console.log('[DEBUG] Loading persisted CTA:', data.selectedCTA);
        setSelectedCTA(data.selectedCTA);
      }

      // Load persisted generated CTAs if available
      if (data.generatedCTAs && data.generatedCTAs.length > 0) {
        console.log('[DEBUG] Loading persisted generated CTAs:', data.generatedCTAs);
        setCtas(data.generatedCTAs);
      }

      // Load persisted selected image if available
      if (data.selectedImage) {
        console.log('[DEBUG] Loading persisted selected image:', data.selectedImage);
        setSelectedImage(data.selectedImage);
      }

      // Note: generatedImages are NOT persisted (too large as base64)
      // Users need to regenerate them if needed by clicking "Generate Images"
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fix malformed markdown links (nested brackets)
  const fixMalformedLinks = (text: string): string => {
    // Match malformed patterns like [text]([nested](url)extra) and convert to [text](url)
    const malformedLinkRegex = /\[([^\[\]]+)\]\(\[([^\[\]]+)\]\(([^)]+)\)[^)]*\)/g;
    let fixed = text.replace(malformedLinkRegex, '[$1]($3)');

    // Also fix patterns like [text]([url)/ and [text]([url]/)
    const alternativeMalformed = /\[([^\[\]]+)\]\(\[?([^[\]]*?https?:\/\/[^)\]]+)\]?\/?[)\]]*\)/g;
    fixed = fixed.replace(alternativeMalformed, (match, text, url) => {
      // Clean up the URL
      const cleanUrl = url.replace(/[\[\]]/g, '').trim();
      return `[${text}](${cleanUrl})`;
    });

    return fixed;
  };

  // Convert bare URLs to markdown links
  const convertBareLUrlsToMarkdown = (text: string): string => {
    // First fix malformed links
    let processed = fixMalformedLinks(text);

    // Regex to find bare URLs not already in markdown format
    const bareUrlRegex = /(?<!\])\(?(https?:\/\/[^\s\)]+)(?!\))/g;

    return processed.replace(bareUrlRegex, (match) => {
      const url = match.replace(/[\(\)]/g, '');
      // Extract a friendly name from URL
      try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(p => p);
        const friendlyName = parts[parts.length - 1] || urlObj.hostname;
        return `[${friendlyName}](${url})`;
      } catch {
        return `[${url}](${url})`;
      }
    });
  };

  const handleSave = async (field: string, value: string) => {
    try {
      setSaving(true);
      setSaveStatus(null);

      // Convert bare URLs to markdown for content field
      let saveValue = value;
      if (field === 'content') {
        saveValue = convertBareLUrlsToMarkdown(value);
      }

      const payload: any = { [field]: saveValue };

      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      const updated = await response.json();
      setArticle(updated);
      // Update content with converted URLs
      if (field === 'content') {
        setContent(saveValue);
      }
      setSaveStatus('success');
    } catch (err) {
      setError((err as Error).message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOutline = async () => {
    try {
      setSaving(true);
      setError('');

      // Call AI API to generate outline
      const response = await fetch('/api/articles/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          title: article?.title,
          targetAudience: audience || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate outline');
      }

      const data = await response.json();
      const generatedOutline = data.outline;

      setOutline(generatedOutline);
      await handleSave('outline', generatedOutline);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDraft = async () => {
    setSaving(true);
    setError('');

    try {
      // Step 1: Generate draft (with brand guidelines)
      console.log('Step 1: Generating draft...');
      const draftResponse = await fetch('/api/articles/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article?.title,
          brief,
          outline,
          targetAudience: audience || undefined,
          workspaceId, // Include workspace for voice profile
        }),
      });

      if (!draftResponse.ok) {
        const data = await draftResponse.json();
        throw new Error(data.error || 'Failed to generate draft');
      }

      const draftData = await draftResponse.json();
      let generatedContent = `# ${article?.title}\n\n${draftData.draft}`;
      generatedContent = convertBareLUrlsToMarkdown(generatedContent);
      setContent(generatedContent);

      // Step 2: Add links to content
      console.log('Step 2: Generating links...');
      try {
        const linksResponse = await fetch('/api/articles/generate-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: generatedContent,
            title: article?.title,
          }),
        });

        if (linksResponse.ok) {
          const linksData = await linksResponse.json();
          if (linksData.content) {
            generatedContent = linksData.content;
            setContent(generatedContent);
          }
        }
      } catch (linkErr) {
        console.warn('Link generation error:', linkErr);
      }

      // Step 3: Generate image prompts
      console.log('Step 3: Generating image prompts...');
      try {
        const imagesResponse = await fetch('/api/articles/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: article?.title,
            brief,
            outline,
          }),
        });

        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          if (imagesData.imagePrompts) {
            const imageNote = `\n\n---\n\n**Image Prompts (for your reference):**\n${imagesData.imagePrompts}\n\n---\n`;
            generatedContent += imageNote;
            setContent(generatedContent);
          }
        }
      } catch (imgErr) {
        console.warn('Image generation error:', imgErr);
      }

      // Step 4: Save final content (only after all APIs complete)
      console.log('Step 4: Saving content...');
      await handleSave('content', generatedContent);
      setCurrentStage('WORKING');
      setSaveStatus('success');
    } catch (err) {
      console.error('Generate draft error:', err);
      setError((err as Error).message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (newStage: ArticleStage) => {
    const validation = validateTransition(currentStage, newStage);
    if (!validation.valid) {
      setError(validation.error || 'Invalid transition');
      return;
    }

    try {
      setSaving(true);
      await handleSave('status', newStage);
      setCurrentStage(newStage);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canTransition = (to: ArticleStage) => {
    return validateTransition(currentStage, to).valid;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment p-8">
        <div className="text-center py-12">
          <p className="text-lg">Loading article editor...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-parchment p-8">
        <div className="text-center py-12">
          <p className="text-lg text-red-600">{error || 'Article not found'}</p>
        </div>
      </div>
    );
  }

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href={`/calendar?strategyId=${strategyId}`} className="btn-secondary text-sm mb-4 inline-block">
                ← Back to Calendar
              </Link>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{article.title}</h1>
              <p className="text-slate-600">Content ID: {article.contentId}</p>
            </div>
            {/* Save Status Indicator */}
            {saveStatus && (
              <div className={`px-3 py-2 rounded text-sm font-medium ${saveStatus === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {saveStatus === 'success' ? '✓ Saved' : '✗ Save failed'}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="flex border-b border-slate-200 overflow-x-auto">
                {(['brief', 'outline', 'content', 'seo', 'crosslinks', 'cta', 'images', 'score', 'workflow', 'sources'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                        ? 'border-b-2 border-signal text-signal'
                        : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    {tab === 'brief' && '📋 Brief'}
                    {tab === 'outline' && '📑 Outline'}
                    {tab === 'content' && '✍️ Content'}
                    {tab === 'seo' && '🔍 SEO'}
                    {tab === 'crosslinks' && '🔗 Links'}
                    {tab === 'cta' && '📣 CTA'}
                    {tab === 'images' && '🖼️ Images'}
                    {tab === 'score' && '✓ Publish-Ready'}
                    {tab === 'workflow' && '🔄 Workflow'}
                    {tab === 'sources' && '📚 Sources'}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'brief' && (
                  <BriefEditor
                    title={article.title}
                    brief={brief}
                    angle={angle}
                    targetAudience={audience}
                    onBriefChange={setBrief}
                    onAngleChange={setAngle}
                    onAudienceChange={setAudience}
                    onSave={() => handleSave('brief', brief)}
                    isSaving={saving}
                  />
                )}

                {activeTab === 'outline' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Article Outline</h3>
                      <button
                        onClick={handleGenerateOutline}
                        disabled={saving || !brief}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {saving ? '⏳ Generating...' : '✨ Generate from Brief'}
                      </button>
                    </div>
                    <textarea
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                      placeholder="Article outline in markdown format..."
                      className="w-full h-96 px-4 py-3 border border-slate-300 rounded text-sm font-mono"
                    />
                    <button
                      onClick={() => handleSave('outline', outline)}
                      disabled={saving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {saving ? '⏳ Saving...' : '💾 Save Outline'}
                    </button>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Article Content</h3>
                      {!content && outline && (
                        <button
                          onClick={handleGenerateDraft}
                          disabled={saving}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {saving ? '⏳ Generating...' : '✨ Generate Draft'}
                        </button>
                      )}
                    </div>

                    {saving ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 flex flex-col items-center justify-center min-h-96">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                          <div className="text-center">
                            <p className="text-lg font-semibold text-slate-900 mb-2">Generating Article Draft</p>
                            <p className="text-sm text-slate-600">
                              Generating outline, creating content, adding links, and generating image prompts...
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : content ? (
                      <ArticleEditor
                        initialContent={content}
                        onChange={setContent}
                        onSave={() => handleSave('content', content)}
                        isSaving={saving}
                      />
                    ) : !outline ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                        <p className="text-slate-600">
                          Generate an outline first, then you can create a draft
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                        <p className="text-slate-600">
                          Start with generating a draft
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'seo' && (
                  <SEOAnalyzer
                    title={article.title}
                    content={content}
                    brief={brief}
                    isLoading={seoLoading}
                    analysis={seoAnalysis}
                    onAnalyze={handleSEOAnalysis}
                  />
                )}

                {activeTab === 'crosslinks' && (
                  <CrosslinkManager
                    articleId={id}
                    title={article.title}
                    content={content}
                    strategyId={strategyId}
                    isLoading={crosslinksLoading}
                    suggestions={suggestedLinks}
                    linkedCount={crosslinks.length}
                    onSuggest={handleSuggestLinks}
                    onContentUpdate={async (newContent) => {
                      setContent(newContent);
                      await handleSave('content', newContent);
                    }}
                  />
                )}

                {activeTab === 'cta' && (
                  <CTAGenerator
                    title={article.title}
                    content={content}
                    brief={brief}
                    targetAudience={audience}
                    onGenerate={handleGenerateCTA}
                    onSelect={handleSelectCTA}
                    isLoading={ctaLoading}
                    ctas={ctas}
                    selectedCTA={selectedCTA}
                  />
                )}

                {activeTab === 'images' && (
                  <ImageGallery
                    title={article.title}
                    brief={brief}
                    outline={outline}
                    onGenerate={handleGenerateImages}
                    onSelect={handleSelectImage}
                    isLoading={imagesLoading}
                    images={images}
                    selectedImage={selectedImage}
                  />
                )}

                {activeTab === 'score' && (
                  <PublishReadiness
                    content={content}
                    title={article.title}
                    wordCount={wordCount}
                    hasImages={!!selectedImage}
                    claimsVerified={0}
                    totalClaims={0}
                    hasCTA={!!selectedCTA}
                  />
                )}

                {activeTab === 'workflow' && (
                  <StageWorkflow
                    currentStage={currentStage}
                    onStageChange={handleStageChange}
                    canTransition={canTransition}
                  />
                )}

                {activeTab === 'sources' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-3">Knowledge Base Sources</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Link sources from your knowledge base to verify claims and provide citations.
                      </p>
                    </div>

                    {sourcesLoading ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-3 border-slate-200 border-t-signal rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-slate-600">Loading sources...</p>
                      </div>
                    ) : sources.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                        <p className="text-slate-600 mb-2">No sources found in knowledge base</p>
                        <p className="text-sm text-slate-500">
                          Add sources to your knowledge base in the Knowledge section to link them here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sources.map((source: any) => {
                          const isCurrentlyLinked = article?.linkedSources?.includes(source.id) || false;
                          const isChecked = selectedSources[source.id] || false;

                          return (
                            <div
                              key={source.id}
                              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start gap-4">
                                <input
                                  type="checkbox"
                                  id={`source-${source.id}`}
                                  checked={isChecked}
                                  onChange={(e) =>
                                    setSelectedSources({
                                      ...selectedSources,
                                      [source.id]: e.target.checked,
                                    })
                                  }
                                  className="mt-1 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={`source-${source.id}`}
                                    className="cursor-pointer block"
                                  >
                                    <p className="font-medium text-slate-900">{source.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Type: <span className="capitalize">{source.type}</span>
                                      {source.author && ` • Author: ${source.author}`}
                                    </p>
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 bg-slate-100 text-xs rounded text-slate-600">
                                    {source.trustTier || 'unreviewed'}
                                  </span>
                                  {isCurrentlyLinked && (
                                    <span className="px-2 py-1 bg-green-100 text-xs rounded text-green-700 font-medium">
                                      ✓ Linked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {sources.length > 0 && (
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={handleLinkSources}
                          disabled={Object.values(selectedSources).every((v) => !v) || saving}
                          className="btn-primary disabled:opacity-50"
                        >
                          {saving ? '⏳ Linking...' : '✓ Link Selected Sources'}
                        </button>
                        <button
                          onClick={() => setSelectedSources({})}
                          disabled={saving}
                          className="btn-secondary disabled:opacity-50"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Article Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-slate-900">Article Info</h3>
              <div className="text-sm space-y-2">
                <div>
                  <p className="text-slate-600 mb-1">Status</p>
                  {(() => {
                    const bgColor = STAGE_COLORS[currentStage];
                    const label = STAGE_LABELS[currentStage];
                    return (
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor: bgColor,
                        }}
                      >
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-slate-600">Word Count</p>
                  <p className="font-semibold text-slate-900">{wordCount} words</p>
                </div>
                <div>
                  <p className="text-slate-600">Linked Sources</p>
                  {article.linkedSources && article.linkedSources.length > 0 ? (
                    <p className="font-semibold text-slate-900">
                      🔗 Linked to {article.linkedSources.length} source{article.linkedSources.length > 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="text-slate-500">No sources linked yet</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Call-to-Action</p>
                  {selectedCTA ? (
                    <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="font-semibold text-green-900">"{selectedCTA.text}"</p>
                      <p className="text-xs text-green-700 mt-1 italic">{selectedCTA.rationale}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No CTA selected yet</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Hero Image</p>
                  {selectedImage ? (
                    <div className="mt-1 rounded overflow-hidden border border-green-200">
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.alt}
                        className="w-full h-auto object-cover"
                      />
                      <p className="text-xs text-green-700 p-2 bg-green-50">
                        ✓ Hero image selected
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No image selected yet</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-600">Created</p>
                  <p className="font-semibold text-slate-900">{new Date(article.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Publish Date</p>
                  {currentStage !== 'APPROVED' && (
                    <p className="text-xs text-slate-500 mb-2">
                      Available only when status is Approved
                    </p>
                  )}
                  {!editingPublishDate ? (
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-900">
                        {publishDate ? new Date(publishDate).toLocaleDateString() : 'Not set'}
                      </p>
                      <button
                        onClick={() => setEditingPublishDate(true)}
                        disabled={currentStage !== 'APPROVED'}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={publishDate ? publishDate.split('T')[0] : ''}
                        onChange={(e) => setPublishDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                        className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                      />
                      <button
                        onClick={async () => {
                          try {
                            setSaving(true);
                            const response = await fetch(`/api/articles/${id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plannedPublishDate: publishDate }),
                            });
                            if (!response.ok) throw new Error('Failed to save publish date');
                            const updated = await response.json();
                            setArticle(updated);
                            setPublishDate(updated.plannedPublishDate || '');
                            setEditingPublishDate(false);
                            setSaveStatus('success');
                          } catch (err) {
                            setError((err as Error).message);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap border border-blue-700"
                      >
                        {saving ? '⏳ Saving...' : '💾 Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-bold text-slate-900 mb-3">Quick Actions</h3>
              <button
                onClick={() => {
                  if (!outline) {
                    setError('Generate outline first');
                    return;
                  }
                  setActiveTab('workflow');
                  handleStageChange('READY_FOR_REVIEW');
                }}
                disabled={!outline || saving}
                className="w-full btn-secondary text-sm disabled:opacity-50"
              >
                📤 Request Review
              </button>
              <button
                onClick={() => {
                  if (wordCount < 600) {
                    setError('Article must be at least 600 words');
                    return;
                  }
                  setActiveTab('score');
                }}
                disabled={wordCount < 600 || saving}
                className="w-full btn-secondary text-sm disabled:opacity-50"
              >
                ✓ Check Publish-Ready
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
