'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';

interface Source {
  id: string;
  type: 'url' | 'document' | 'transcript' | 'case_study';
  title: string;
  canonicalUrl?: string;
  author?: string;
  trustTier: 'approved' | 'unreviewed' | 'quarantined';
  citationPermission: boolean;
  description?: string;
  transcriptText?: string;
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  agentSensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  classificationConfidence?: number;
  classificationReasoning?: string;
  classificationSource?: 'agent' | 'manual';
  // Fetched content from URL crawling
  fetchedContent?: string;
  fetchedHeadings?: string[];
  contentFetchError?: string;
  // Brand alignment fields
  brandAlignmentScore?: number;
  brandAlignmentLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  brandMatchedRules?: string[];
  brandViolatedRules?: string[];
  createdAt: string;
}

// SVG Icons
const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

function KnowledgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { workspaceId, user, loading: authLoading } = useWorkspace();
  const strategyId = searchParams?.get('strategyId');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-signal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [classifyingSourceId, setClassifyingSourceId] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    type: 'url' as Source['type'],
    title: '',
    canonicalUrl: '',
    author: '',
    description: '',
    transcriptText: '',
    file: null as File | null,
  });

  const [editFormData, setEditFormData] = useState<Partial<Source> & { file?: File | null }>({});
  const [claimsCount, setClaimsCount] = useState<Record<string, number>>({});
  const [expandedClaims, setExpandedClaims] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | Source['type']>('all');
  const [filterSensitivity, setFilterSensitivity] = useState<'all' | 'public' | 'internal' | 'confidential' | 'restricted'>('all');
  const [filterTrustTier, setFilterTrustTier] = useState<'all' | 'approved' | 'unreviewed' | 'quarantined'>('all');

  // Brand Memory state
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [isSavingBrandProfile, setIsSavingBrandProfile] = useState(false);
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [strongExemplars, setStrongExemplars] = useState<string[]>([]);
  const [weakExemplars, setWeakExemplars] = useState<string[]>([]);
  const [newStrongExemplar, setNewStrongExemplar] = useState('');
  const [newWeakExemplar, setNewWeakExemplar] = useState('');
  // Structured voice profile fields
  const [principles, setPrinciples] = useState<string[]>([]);
  const [desiredPatterns, setDesiredPatterns] = useState<string[]>([]);
  const [prohibitedPatterns, setProhibitedPatterns] = useState<string[]>([]);
  const [toneBoundaries, setToneBoundaries] = useState<string[]>([]);
  const [terminology, setTerminology] = useState<Record<string, string>>({});
  const [newPrinciple, setNewPrinciple] = useState('');
  const [newDesiredPattern, setNewDesiredPattern] = useState('');
  const [newProhibitedPattern, setNewProhibitedPattern] = useState('');
  const [newToneBoundary, setNewToneBoundary] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [newTermExplanation, setNewTermExplanation] = useState('');
  const [_voiceProfile, _setVoiceProfile] = useState<any>(null);
  const [voiceAlignmentScores, setVoiceAlignmentScores] = useState<Record<string, number>>({});
  const [plagiarismScores, setPlagiarismScores] = useState<Record<string, number>>({});
  const [brandApprovalStatus, setBrandApprovalStatus] = useState('pending'); // pending | approved

  // Blocked Feeds Configuration state
  const [showBlockedFeedsConfig, setShowBlockedFeedsConfig] = useState(false);
  const [blockedFeeds, setBlockedFeeds] = useState<string[]>(['/feeds/blog/']); // Default
  const [blockedFeedsInput, setBlockedFeedsInput] = useState('/feeds/blog/'); // For textarea

  useEffect(() => {
    if (strategyId) {
      fetchSources();
      loadBrandProfile();
      loadBlockedFeeds();
    }
  }, [strategyId]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadBrandProfile = async () => {
    try {
      const response = await fetch(`/api/knowledge/brand-profile?workspaceId=${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setBrandGuidelines(data.profile.guidelines || '');
          setStrongExemplars(data.profile.strongExemplars || []);
          setWeakExemplars(data.profile.weakExemplars || []);
          setPrinciples(data.profile.principles || []);
          setDesiredPatterns(data.profile.desiredPatterns || []);
          setProhibitedPatterns(data.profile.prohibitedPatterns || []);
          setToneBoundaries(data.profile.toneBoundaries || []);
          setTerminology(data.profile.terminology || {});
          setBrandApprovalStatus(data.profile.approvalStatus || 'pending');
        }
      }
    } catch (err) {
      console.error('Failed to load brand profile:', err);
    }
  };

  const loadBlockedFeeds = async () => {
    if (!strategyId) return;
    try {
      const response = await fetch(`/api/knowledge/blocked-feeds?strategyId=${strategyId}`);
      if (response.ok) {
        const data = await response.json();
        setBlockedFeeds(data.blockedFeeds || ['/feeds/blog/']);
        setBlockedFeedsInput(data.blockedFeeds.join('\n') || '/feeds/blog/');
      }
    } catch (err) {
      console.error('Failed to load blocked feeds:', err);
    }
  };

  // Load claims after sources are fetched
  useEffect(() => {
    if (sources.length > 0) {
      loadAllClaims();
    }
  }, [sources]);

  const loadAllClaims = async () => {
    const counts: Record<string, number> = {};
    for (const source of sources) {
      try {
        const res = await fetch(`/api/knowledge/claims?sourceId=${source.id}`);
        if (res.ok) {
          const data = await res.json();
          counts[source.id] = data.claims?.length || 0;
        }
      } catch (err) {
        console.error('Failed to load claims:', err);
        counts[source.id] = 0; // Default to 0 if fetch fails
      }
    }
    setClaimsCount(counts);
  };

  const fetchSources = async () => {
    if (!strategyId) return;
    try {
      const res = await fetch(`/api/knowledge/sources?strategyId=${strategyId}`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch (err) {
      setError('Failed to load sources');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyId || !formData.title) return;

    setIsAddingSource(true);

    // Validate URL format for URL type sources
    if (formData.type === 'url' && !validateUrl(formData.canonicalUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      setIsAddingSource(false);
      return;
    }

    // For URL sources: validate accessibility and content
    if (formData.type === 'url' && formData.canonicalUrl) {
      try {
        const validateRes = await fetch('/api/knowledge/sources/fetch-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formData.canonicalUrl }),
        });

        const validateData = await validateRes.json();

        // Check if fetch was successful
        if (!validateRes.ok || !validateData.success) {
          setError(`❌ URL is not valid: ${validateData.reason || validateData.error}`);
          setIsAddingSource(false);
          return;
        }

        // Check if page has meaningful content (minimum 300 characters)
        const contentLength = validateData.content.bodyText.length;
        if (contentLength < 300) {
          setError('URL is not valid');
          setIsAddingSource(false);
          return;
        }
      } catch (err) {
        setError('Failed to validate URL. Please try again.');
        console.error('URL validation error:', err);
        setIsAddingSource(false);
        return;
      }
    }

    // Feed exclusion - check against blocked feeds
    if (formData.type === 'url' && isFromBlockedFeed(formData.canonicalUrl)) {
      const blockedPaths = blockedFeeds.join(', ');
      setError(`Sources from blocked feed paths (${blockedPaths}) are not allowed. Configure blocked feeds in settings.`);
      setIsAddingSource(false);
      return;
    }

    // Check for duplicate URL + type
    const isDuplicateUrl =
      formData.type === 'url' &&
      sources.some((s) => s.canonicalUrl === formData.canonicalUrl && s.type === 'url');

    if (isDuplicateUrl) {
      setError('This URL has already been added as a source.');
      setIsAddingSource(false);
      return;
    }

    // Check for plagiarism/duplicates - HARD BLOCKER
    try {
      const plagiarismRes = await fetch('/api/knowledge/sources/plagiarism-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          canonicalUrl: formData.canonicalUrl,
          strategyId,
        }),
      });

      if (plagiarismRes.ok) {
        const plagiarismData = await plagiarismRes.json();
        if (plagiarismData.isDuplicate && plagiarismData.duplicates.length > 0) {
          // Remove duplicate entries (same sourceId)
          const uniqueDups = Array.from(
            new Map(plagiarismData.duplicates.map((d: any) => [d.sourceId, d])).values()
          );
          const dupList = uniqueDups
            .map((d: any) => `"${d.sourceTitle}" (${d.reason})`)
            .join(', ');
          setError(
            `❌ DUPLICATE SOURCE BLOCKED: ${dupList}. This is a non-overridable blocker to maintain source quality.`
          );
          setIsAddingSource(false);
          return; // HARD BLOCK - no override possible
        }
      }
    } catch (err) {
      console.error('Plagiarism check failed:', err);
      // Don't block on plagiarism check failure
    }

    setError(''); // Clear error if validation passes

    try {
      const payload: any = {
        strategyId,
        type: formData.type,
        title: formData.title,
        author: formData.author || undefined,
      };

      if (formData.type === 'url') payload.canonicalUrl = formData.canonicalUrl;
      if (formData.type === 'document') payload.description = formData.description;
      if (formData.type === 'transcript') payload.transcriptText = formData.transcriptText;
      if (formData.type === 'case_study') payload.description = formData.description;

      const res = await fetch('/api/knowledge/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newSourceRes = await res.json();
        const newSourceId = newSourceRes.id;

        // Add to list with classifying state
        const newSource: Source = {
          id: newSourceId,
          type: formData.type,
          title: formData.title,
          canonicalUrl: formData.canonicalUrl,
          author: formData.author,
          description: formData.description,
          transcriptText: formData.transcriptText,
          trustTier: 'unreviewed',
          citationPermission: false,
          createdAt: new Date().toISOString(),
        };

        setSources((prev) => [newSource, ...prev]);
        setClassifyingSourceId(newSourceId);

        setFormData({
          type: 'url',
          title: '',
          canonicalUrl: '',
          author: '',
          description: '',
          transcriptText: '',
          file: null,
        });
        setShowForm(false);

        // For URL sources, fetch content first
        let fetchedContent = '';
        let fetchedHeadings: string[] = [];
        if (formData.type === 'url' && formData.canonicalUrl) {
          try {
            const fetchRes = await fetch('/api/knowledge/sources/fetch-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: formData.canonicalUrl }),
            });

            if (fetchRes.ok) {
              const fetchData = await fetchRes.json();
              if (fetchData.success) {
                fetchedContent = fetchData.content.bodyText;
                fetchedHeadings = fetchData.content.headings;

                // Save fetched content to source
                await fetch(`/api/knowledge/sources/${newSourceId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    fetchedContent,
                    fetchedHeadings,
                  }),
                });

                // Update local state with fetched content
                setSources((prev) =>
                  prev.map((s) =>
                    s.id === newSourceId
                      ? { ...s, fetchedContent, fetchedHeadings }
                      : s
                  )
                );
              }
            }
          } catch (err) {
            console.error('Error fetching URL content:', err);
            // Continue without fetched content
          }
        }

        // Classify source
        try {
          const sourceContent =
            fetchedContent ||
            formData.transcriptText ||
            formData.description ||
            formData.canonicalUrl ||
            `${formData.type} source`;

          const classifyResponse = await fetch('/api/knowledge/sources/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceTitle: formData.title,
              sourceContent: sourceContent.substring(0, 1000),
              sourceType: formData.type,
            }),
          });

          if (classifyResponse.ok) {
            const classificationData = await classifyResponse.json();
            const derivedTrustTier = deriveTrustTier(
              classificationData.sensitivityLevel,
              classificationData.canCite
            );

            // Update local state
            setSources((prev) =>
              prev.map((s) =>
                s.id === newSourceId
                  ? {
                    ...s,
                    sensitivityLevel: classificationData.sensitivityLevel,
                    agentSensitivityLevel: classificationData.sensitivityLevel,
                    classificationConfidence: classificationData.confidence,
                    classificationReasoning: classificationData.reasoning,
                    citationPermission: classificationData.canCite,
                    trustTier: derivedTrustTier,
                    classificationSource: 'agent',
                  }
                  : s
              )
            );

            // Persist classification data to backend
            try {
              await fetch(`/api/knowledge/sources/${newSourceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sensitivityLevel: classificationData.sensitivityLevel,
                  agentSensitivityLevel: classificationData.sensitivityLevel,
                  classificationConfidence: classificationData.confidence,
                  classificationReasoning: classificationData.reasoning,
                  citationPermission: classificationData.canCite,
                  trustTier: derivedTrustTier,
                  classificationSource: 'agent',
                }),
              });

              // Score source against brand profile
              if (brandApprovalStatus === 'approved') {
                try {
                  const brandScoreRes = await fetch('/api/knowledge/sources/brand-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      strategyId,
                      sourceTitle: formData.title,
                      sourceContent: formData.description || formData.canonicalUrl || formData.transcriptText || '',
                      sourceType: formData.type,
                    }),
                  });

                  if (brandScoreRes.ok) {
                    const brandScore = await brandScoreRes.json();

                    // Update source with brand alignment data
                    setSources((prev) =>
                      prev.map((s) =>
                        s.id === newSourceId
                          ? {
                            ...s,
                            brandAlignmentScore: brandScore.alignmentScore,
                            brandAlignmentLevel: brandScore.alignmentLevel,
                            brandMatchedRules: brandScore.matchedRules,
                            brandViolatedRules: brandScore.violatedRules,
                          }
                          : s
                      )
                    );
                  }
                } catch (brandErr) {
                  console.error('Failed to score brand alignment:', brandErr);
                }
              }
            } catch (persistErr) {
              console.error('Failed to persist classification:', persistErr);
            }
          }
        } catch (classifyErr) {
          console.error('Classification failed:', classifyErr);
        } finally {
          setClassifyingSourceId(null);
          setIsAddingSource(false);
        }
      }
    } catch (err) {
      setError('Failed to add source');
      console.error(err);
      setIsAddingSource(false);
    }
  };

  const handleEditSource = async (sourceId: string) => {
    if (!strategyId) return;

    const source = sources.find((s) => s.id === sourceId);
    if (!source) return;

    // Check if URL was changed (for URL type sources)
    const urlChanged = source.type === 'url' && editFormData.canonicalUrl && editFormData.canonicalUrl !== source.canonicalUrl;

    try {
      const payload: any = {
        sensitivityLevel: editFormData.sensitivityLevel,
        citationPermission: editFormData.citationPermission,
      };

      if (editFormData.title) payload.title = editFormData.title;
      if (editFormData.author !== undefined) payload.author = editFormData.author;
      if (editFormData.type === 'url' && editFormData.canonicalUrl)
        payload.canonicalUrl = editFormData.canonicalUrl;
      if (editFormData.description !== undefined) payload.description = editFormData.description;
      if (editFormData.transcriptText !== undefined) payload.transcriptText = editFormData.transcriptText;

      const res = await fetch(`/api/knowledge/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        let updatedSource = {
          ...source,
          title: editFormData.title || source.title,
          author: editFormData.author !== undefined ? editFormData.author : source.author,
          canonicalUrl: editFormData.canonicalUrl || source.canonicalUrl,
          description: editFormData.description !== undefined ? editFormData.description : source.description,
          transcriptText: editFormData.transcriptText !== undefined ? editFormData.transcriptText : source.transcriptText,
          sensitivityLevel: editFormData.sensitivityLevel || source.sensitivityLevel,
          citationPermission: editFormData.citationPermission !== undefined ? editFormData.citationPermission : source.citationPermission,
        };

        // If URL changed, re-classify the source
        if (urlChanged) {
          try {
            const classifyResponse = await fetch('/api/knowledge/sources/classify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sourceTitle: editFormData.title || source.title,
                sourceContent: editFormData.canonicalUrl,
                sourceType: source.type,
              }),
            });

            if (classifyResponse.ok) {
              const classificationData = await classifyResponse.json();
              const derivedTrustTier = deriveTrustTier(
                classificationData.sensitivityLevel,
                classificationData.canCite
              );

              updatedSource = {
                ...updatedSource,
                sensitivityLevel: classificationData.sensitivityLevel,
                agentSensitivityLevel: classificationData.sensitivityLevel,
                classificationConfidence: classificationData.confidence,
                classificationReasoning: classificationData.reasoning,
                citationPermission: classificationData.canCite,
                trustTier: derivedTrustTier,
                classificationSource: 'agent',
              };

              // Persist re-classification to backend
              await fetch(`/api/knowledge/sources/${sourceId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sensitivityLevel: classificationData.sensitivityLevel,
                  agentSensitivityLevel: classificationData.sensitivityLevel,
                  classificationConfidence: classificationData.confidence,
                  classificationReasoning: classificationData.reasoning,
                  citationPermission: classificationData.canCite,
                  trustTier: derivedTrustTier,
                  classificationSource: 'agent',
                }),
              });
            }
          } catch (classifyErr) {
            console.error('Re-classification failed:', classifyErr);
          }
        } else {
          // If URL didn't change, check for manual override
          const newSensitivityLevel = editFormData.sensitivityLevel || source.sensitivityLevel;
          const isManualOverride = newSensitivityLevel !== source.agentSensitivityLevel && source.classificationSource === 'agent';
          updatedSource.classificationSource = isManualOverride ? 'manual' : source.classificationSource;
        }

        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? updatedSource : s))
        );
        setEditingSourceId(null);
        setEditFormData({});
      }
    } catch (err) {
      setError('Failed to update source');
      console.error(err);
    }
  };

  const getClaims = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/knowledge/claims?sourceId=${sourceId}`);
      if (res.ok) {
        const data = await res.json();
        return data.claims || [];
      }
    } catch (err) {
      console.error('Failed to fetch claims:', err);
    }
    return [];
  };

  const deleteSource = async (sourceId: string) => {
    try {
      setDeleteError(''); // Reset error when opening modal
      const source = sources.find((s) => s.id === sourceId);
      if (!source) return;

      setSourceToDelete(source);
      setShowDeleteModal(true);
    } catch (err) {
      setError('Failed to delete source');
      console.error(err);
    }
  };

  const confirmDeleteSource = async () => {
    if (!sourceToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/knowledge/sources/${sourceToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== sourceToDelete.id));
        setError('');
        setDeleteError('');
        setShowDeleteModal(false);
        setSourceToDelete(null);
      } else {
        // Handle error response from API
        const data = await res.json();
        setDeleteError(data.message || data.error || 'Failed to delete source');
        console.error('Delete error:', data);
      }
    } catch (err) {
      setDeleteError('Failed to delete source. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const deriveTrustTier = (
    sensitivityLevel: 'public' | 'internal' | 'confidential' | 'restricted',
    canCite: boolean
  ): Source['trustTier'] => {
    if (sensitivityLevel === 'public' && canCite) {
      return 'approved';
    }
    if (sensitivityLevel === 'restricted') {
      return 'quarantined';
    }
    if (sensitivityLevel === 'confidential') {
      return 'quarantined';
    }
    return 'unreviewed';
  };

  const getTrustTierDisplay = (source: Source) => {
    if (!source.sensitivityLevel) {
      return source.trustTier;
    }
    return deriveTrustTier(source.sensitivityLevel, source.citationPermission);
  };

  // Filtering function
  const getFilteredSources = () => {
    return sources.filter((source) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        source.title.toLowerCase().includes(searchLower) ||
        source.canonicalUrl?.toLowerCase().includes(searchLower) ||
        source.author?.toLowerCase().includes(searchLower);

      if (searchTerm && !matchesSearch) return false;

      // Type filter
      if (filterType !== 'all' && source.type !== filterType) return false;

      // Sensitivity filter
      if (filterSensitivity !== 'all' && source.sensitivityLevel !== filterSensitivity) return false;

      // Trust tier filter
      if (filterTrustTier !== 'all') {
        const displayTier = getTrustTierDisplay(source);
        if (displayTier !== filterTrustTier) return false;
      }

      return true;
    });
  };

  // Feed exclusion - check against configurable blocked feeds list
  const isFromBlockedFeed = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Check if URL matches any blocked feed pattern
      return blockedFeeds.some((blockedPath) => pathname.includes(blockedPath));
    } catch {
      return false;
    }
  };

  const getTypeColor = (type: Source['type']) => {
    const colors: Record<Source['type'], string> = {
      url: '#0EA5E9',
      document: '#8B5CF6',
      transcript: '#EC4899',
      case_study: '#10B981',
    };
    return colors[type];
  };

  const getTypeLabel = (type: Source['type']) => {
    const labels: Record<Source['type'], string> = {
      url: 'URL',
      document: 'Document',
      transcript: 'Transcript',
      case_study: 'Case Study',
    };
    return labels[type];
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sources...</div>;
  }

  return (
    <div className="p-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg text-white text-sm font-medium transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          onClick={() => setToast(null)}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-slate-600">Manage sources, classify sensitivity, and govern citations</p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setError('');
                }}
                className="btn-primary whitespace-nowrap text-sm"
              >
                + Add Source
              </button>
            )}
            <button
              onClick={() => setShowBrandSettings(true)}
              className="btn-secondary whitespace-nowrap text-sm"
              title="Manage brand guidelines and voice profile"
            >
              🎨 Brand Memory
            </button>
            <button
              onClick={() => setShowBlockedFeedsConfig(true)}
              className="btn-secondary whitespace-nowrap text-sm"
              title="Configure blocked feed paths"
            >
              🚫 Blocked Feeds
            </button>
            <button
              onClick={() => router.push(`/topics?strategyId=${strategyId}`)}
              className="btn-secondary whitespace-nowrap text-sm"
            >
              ← Back to Topics
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>}

        {/* Search & Filter Bar */}
        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Search by title, URL, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Source Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="url">🔗 URL</option>
                  <option value="document">📄 Document</option>
                  <option value="transcript">🎤 Transcript</option>
                  <option value="case_study">📊 Case Study</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Sensitivity</label>
                <select
                  value={filterSensitivity}
                  onChange={(e) => setFilterSensitivity(e.target.value as any)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="public">🌐 Public</option>
                  <option value="internal">🏢 Internal</option>
                  <option value="confidential">🔒 Confidential</option>
                  <option value="restricted">🚫 Restricted</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Trust Tier</label>
                <select
                  value={filterTrustTier}
                  onChange={(e) => setFilterTrustTier(e.target.value as any)}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="approved">✓ Approved</option>
                  <option value="unreviewed">⏳ Unreviewed</option>
                  <option value="quarantined">🚫 Quarantined</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Add Source Form Toggle */}
        <div className="mb-8">
          {showForm && (
            <div className="border border-slate-300 rounded-lg p-6 bg-slate-100" style={{ background: "#fff" }}>
              <h2 className="text-lg font-semibold mb-4">Add New Source</h2>
              <form onSubmit={handleAddSource} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Source Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Source['type'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="url">🔗 URL</option>
                      <option value="document">📄 Document</option>
                      <option value="transcript">🎤 Transcript</option>
                      <option value="case_study">📊 Case Study</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        setError('');
                      }}
                      placeholder="Source title"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Author (optional)</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => {
                        setFormData({ ...formData, author: e.target.value });
                        setError('');
                      }}
                      placeholder="Author name"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>

                  {formData.type === 'url' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">URL *</label>
                      <input
                        type="url"
                        value={formData.canonicalUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, canonicalUrl: e.target.value });
                          setError('');
                        }}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        required
                      />
                    </div>
                  )}

                  {formData.type === 'document' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Document *</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          setFormData({ ...formData, file: e.target.files?.[0] || null });
                          setError('');
                        }}
                        accept=".pdf,.doc,.docx,.html,.txt,.md"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        required
                      />
                      {formData.file && (
                        <p className="text-xs text-slate-600 mt-2">
                          Selected: <strong>{formData.file.name}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  {formData.type === 'transcript' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Transcript Text *</label>
                      <textarea
                        value={formData.transcriptText}
                        onChange={(e) => {
                          setFormData({ ...formData, transcriptText: e.target.value });
                          setError('');
                        }}
                        placeholder="Paste transcript content"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        rows={2}
                        required
                      />
                    </div>
                  )}

                  {formData.type === 'case_study' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Case Study Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          setError('');
                        }}
                        placeholder="Describe the case study"
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                        rows={2}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={
                      isAddingSource ||
                      !formData.title ||
                      (formData.type === 'url' && !formData.canonicalUrl) ||
                      (formData.type === 'document' && !formData.file) ||
                      (formData.type === 'transcript' && !formData.transcriptText) ||
                      (formData.type === 'case_study' && !formData.description)
                    }
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    {isAddingSource ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding Source...
                      </>
                    ) : (
                      '✓ Add Source'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError('');
                    }}
                    className="btn-secondary"
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sources List - Compact Cards */}
        {sources.length > 0 ? (
          <div className="space-y-4">
            {getFilteredSources().length > 0 ? (
            getFilteredSources().map((source) => {
              const isEditing = editingSourceId === source.id;
              const isClassifying = classifyingSourceId === source.id;
              const trustTier = source.sensitivityLevel ? getTrustTierDisplay(source) : null;
              const confidencePercent = source.classificationConfidence
                ? Math.round(source.classificationConfidence * 100)
                : 0;

              return (
                <div key={source.id} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                  {/* Classifying Loader */}
                  {isClassifying ? (
                    <div className="p-6 text-center">
                      <div className="inline-block mb-3">
                        <div className="w-8 h-8 border-3 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium text-slate-700">Classifying source...</p>
                      <p className="text-xs text-slate-500 mt-1">Analyzing sensitivity level and citation permissions</p>
                    </div>
                  ) : /* Compact Display View */ !isEditing ? (
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Title & Type Badge Row */}
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base">{source.title}</h3>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                              style={{ backgroundColor: getTypeColor(source.type) }}
                            >
                              {getTypeLabel(source.type)}
                            </span>
                            {source.author && <span className="text-sm text-slate-600">by {source.author}</span>}
                          </div>

                          {/* URL Row */}
                          {source.canonicalUrl && (
                            <div className="text-sm text-slate-600 mb-2">
                              <a
                                href={source.canonicalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {source.canonicalUrl}
                              </a>
                            </div>
                          )}

                          {/* Description/Content */}
                          {source.description && (
                            <p className="text-sm text-slate-700 mb-2 line-clamp-2">{source.description}</p>
                          )}

                          {/* Classification & Status Row */}
                          {source.sensitivityLevel && (
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              <span className="font-medium">
                                {source.sensitivityLevel.charAt(0).toUpperCase() + source.sensitivityLevel.slice(1)}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span
                                className="px-2 py-0.5 rounded font-medium text-white text-xs"
                                style={{
                                  backgroundColor:
                                    trustTier === 'approved'
                                      ? '#10B981'
                                      : trustTier === 'quarantined'
                                        ? '#EF4444'
                                        : '#9CA3AF',
                                }}
                              >
                                {trustTier === 'approved'
                                  ? '✓ Approved'
                                  : trustTier === 'quarantined'
                                    ? '🚫 Quarantined'
                                    : '⊙ Unreviewed'}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded font-medium text-white text-xs"
                                style={{
                                  backgroundColor: source.citationPermission ? '#10B981' : '#EF4444',
                                }}
                              >
                                {source.citationPermission ? '✅ Can Cite' : '❌ No Citation'}
                              </span>
                              {source.classificationSource && (
                                <span
                                  className="px-2 py-0.5 rounded font-medium text-white text-xs"
                                  style={{
                                    backgroundColor: source.classificationSource === 'agent' ? '#3B82F6' : '#F59E0B',
                                  }}
                                >
                                  {source.classificationSource === 'agent' ? '🤖 Agent Analysis' : '✋ Manual'}
                                </span>
                              )}
                              {source.classificationSource === 'agent' && source.classificationConfidence && (
                                <span className="text-slate-500 text-xs">{confidencePercent}% confidence</span>
                              )}
                            </div>
                          )}

                          {/* Reasoning */}
                          {source.classificationReasoning && (
                            <p className="text-sm text-slate-600 mt-2">
                              <strong className="text-slate-700">Why:</strong> {source.classificationReasoning}
                            </p>
                          )}

                          {/* Brand Alignment Score */}
                          {source.brandAlignmentScore !== undefined && brandApprovalStatus === 'approved' && (
                            <div className="mt-3 space-y-2 p-3 bg-purple-50 rounded border border-purple-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-purple-900">🎨 Brand Alignment</span>
                                <span className={`text-sm font-bold ${
                                  source.brandAlignmentScore >= 80
                                    ? 'text-green-700'
                                    : source.brandAlignmentScore >= 60
                                      ? 'text-blue-700'
                                      : source.brandAlignmentScore >= 40
                                        ? 'text-yellow-700'
                                        : 'text-red-700'
                                }`}>
                                  {source.brandAlignmentScore}%
                                </span>
                              </div>

                              {/* Matched Rules */}
                              {source.brandMatchedRules && source.brandMatchedRules.length > 0 && (
                                <div className="text-xs space-y-1">
                                  <span className="font-medium text-green-800">✓ Strengths:</span>
                                  <ul className="list-disc list-inside text-green-700 ml-1">
                                    {source.brandMatchedRules.map((rule, idx) => (
                                      <li key={idx}>{rule}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Violated Rules */}
                              {source.brandViolatedRules && source.brandViolatedRules.length > 0 && (
                                <div className="text-xs space-y-1">
                                  <span className="font-medium text-red-800">✗ Areas of concern:</span>
                                  <ul className="list-disc list-inside text-red-700 ml-1">
                                    {source.brandViolatedRules.map((rule, idx) => (
                                      <li key={idx}>{rule}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quality Badges Footer */}
                          {source.sensitivityLevel && (
                            <div className="mt-3 space-y-2">
                              {/* Claims & Plagiarism Badges */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                                  📎 Used in {claimsCount[source.id] ?? 0} article{(claimsCount[source.id] ?? 0) !== 1 ? 's' : ''}
                                </span>
                                {(claimsCount[source.id] ?? 0) > 0 && (
                                  <button
                                    onClick={() =>
                                      setExpandedClaims(expandedClaims === source.id ? null : source.id)
                                    }
                                    className="text-xs text-blue-600 hover:text-blue-900"
                                  >
                                    {expandedClaims === source.id ? 'Hide' : 'View'} articles
                                  </button>
                                )}
                                <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                                  ✓ Original (No plagiarism detected)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions - Icons Only */}
                        <div className="flex gap-2 flex-shrink-0">
                          {source.sensitivityLevel && (
                            <button
                              onClick={() => {
                                setEditingSourceId(source.id);
                                setEditFormData({
                                  type: source.type,
                                  title: source.title,
                                  canonicalUrl: source.canonicalUrl,
                                  author: source.author,
                                  description: source.description,
                                  transcriptText: source.transcriptText,
                                  sensitivityLevel: source.sensitivityLevel,
                                  citationPermission: source.citationPermission,
                                });
                                setError('');
                              }}
                              title="Edit source"
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 rounded transition"
                            >
                              <EditIcon />
                            </button>
                          )}
                          <button
                            onClick={() => deleteSource(source.id)}
                            title="Delete source"
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded transition"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edit Form */
                    <div className="p-4 bg-slate-50 border-t border-slate-300">
                      <h4 className="font-semibold text-base mb-4">Edit Source</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Source Type</label>
                            <select
                              value={editFormData.type || source.type || 'url'}
                              onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as Source['type'] })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                              disabled
                            >
                              <option value="url">🔗 URL</option>
                              <option value="document">📄 Document</option>
                              <option value="transcript">🎤 Transcript</option>
                              <option value="case_study">📊 Case Study</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">(cannot be changed)</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                              type="text"
                              value={editFormData.title || ''}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, title: e.target.value });
                                setError('');
                              }}
                              placeholder="Required"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Author</label>
                            <input
                              type="text"
                              value={editFormData.author || ''}
                              onChange={(e) => {
                                setEditFormData({ ...editFormData, author: e.target.value });
                                setError('');
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            />
                          </div>

                          {(editFormData.type || source.type) === 'url' && (
                            <div>
                              <label className="block text-sm font-medium mb-1">URL *</label>
                              <input
                                type="url"
                                value={editFormData.canonicalUrl || ''}
                                onChange={(e) => {
                                  setEditFormData({ ...editFormData, canonicalUrl: e.target.value });
                                  setError('');
                                }}
                                placeholder="https://example.com"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                              />
                            </div>
                          )}

                          {((editFormData.type || source.type) === 'document' || (editFormData.type || source.type) === 'case_study') && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Description *</label>
                              <textarea
                                value={editFormData.description || ''}
                                onChange={(e) => {
                                  setEditFormData({ ...editFormData, description: e.target.value });
                                  setError('');
                                }}
                                placeholder="Describe the source"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                rows={2}
                              />
                            </div>
                          )}

                          {(editFormData.type || source.type) === 'transcript' && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Transcript Text *</label>
                              <textarea
                                value={editFormData.transcriptText || ''}
                                onChange={(e) => {
                                  setEditFormData({ ...editFormData, transcriptText: e.target.value });
                                  setError('');
                                }}
                                placeholder="Paste transcript content"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Sensitivity Level</label>
                            <select
                              value={editFormData.sensitivityLevel || 'public'}
                              onChange={(e) => {
                                const newLevel = e.target.value as any;
                                setEditFormData({
                                  ...editFormData,
                                  sensitivityLevel: newLevel,
                                  citationPermission:
                                    newLevel === 'public'
                                      ? editFormData.citationPermission
                                      : false,
                                });
                                setError('');
                              }}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                            >
                              <option value="public">🌐 Public</option>
                              <option value="internal">🏢 Internal</option>
                              <option value="confidential">🔒 Confidential</option>
                              <option value="restricted">🚫 Restricted</option>
                            </select>
                          </div>

                          <label
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition ${editFormData.sensitivityLevel === 'public'
                                ? 'border-green-400 bg-green-50 hover:bg-green-100 cursor-pointer'
                                : 'border-slate-300 bg-slate-100 cursor-not-allowed opacity-50'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.citationPermission || false}
                              onChange={(e) => {
                                if (editFormData.sensitivityLevel === 'public') {
                                  setEditFormData({
                                    ...editFormData,
                                    citationPermission: e.target.checked,
                                  });
                                  setError('');
                                }
                              }}
                              disabled={editFormData.sensitivityLevel !== 'public'}
                              className={`w-4 h-4 ${editFormData.sensitivityLevel === 'public'
                                  ? 'cursor-pointer'
                                  : 'cursor-not-allowed'
                                }`}
                            />
                            <span className="text-sm font-medium whitespace-nowrap">Can Cite</span>
                          </label>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => handleEditSource(source.id)}
                            disabled={
                              !editFormData.title ||
                              ((editFormData.type || source.type) === 'url' && !editFormData.canonicalUrl) ||
                              (((editFormData.type || source.type) === 'document' || (editFormData.type || source.type) === 'case_study') && !editFormData.description) ||
                              ((editFormData.type || source.type) === 'transcript' && !editFormData.transcriptText)
                            }
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded transition whitespace-nowrap border border-cyan-600"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingSourceId(null);
                              setEditFormData({});
                              setError('');
                            }}
                            className="px-6 py-2 bg-white border-2 border-slate-400 text-slate-700 font-medium text-sm rounded transition whitespace-nowrap hover:bg-slate-50"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm font-medium">No sources match your filters</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-2">📚</div>
            <p className="font-medium">No sources added yet</p>
            <p className="text-sm">Click "Add Source" to get started</p>
          </div>
        )}

        {/* Blocked Feeds Configuration Modal */}
        {showBlockedFeedsConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Configure Blocked Feed Paths</h2>
                <button
                  onClick={() => setShowBlockedFeedsConfig(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Enter feed paths that should be excluded from sources. One path per line. Any URL containing these paths will be blocked.
                </p>

                <textarea
                  value={blockedFeedsInput}
                  onChange={(e) => setBlockedFeedsInput(e.target.value)}
                  placeholder="Enter blocked feed paths (one per line)&#10;Example:&#10;/feeds/blog/&#10;/old-content/&#10;/archive/"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm font-mono"
                  rows={8}
                />

                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-medium text-blue-900">
                    <strong>Blocked Paths:</strong> {blockedFeeds.map((f) => `"${f}"`).join(', ')} {blockedFeeds.length === 0 && '(none)'}
                  </p>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p><strong>Examples:</strong></p>
                  <p>• <code className="bg-slate-100 px-1">/feeds/blog/</code> — blocks codewave.com/feeds/blog/anything</p>
                  <p>• <code className="bg-slate-100 px-1">/old-content/</code> — blocks site.com/old-content/post</p>
                  <p>• <code className="bg-slate-100 px-1">/archive/</code> — blocks any URL with /archive/ in path</p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={async () => {
                      try {
                        // Parse input into array
                        const feeds = blockedFeedsInput
                          .split('\n')
                          .map((f) => f.trim())
                          .filter((f) => f.length > 0);

                        if (feeds.length === 0) {
                          setError('Please enter at least one blocked feed path');
                          return;
                        }

                        const response = await fetch('/api/knowledge/blocked-feeds', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            strategyId,
                            blockedFeeds: feeds,
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setBlockedFeeds(data.blockedFeeds);
                          setError('');
                          setShowBlockedFeedsConfig(false);
                          console.log('✓ Blocked feeds updated');
                        } else {
                          setError('Failed to save blocked feeds');
                        }
                      } catch (err) {
                        setError('Error saving blocked feeds: ' + (err as Error).message);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium transition"
                  >
                    ✓ Save Blocked Feeds
                  </button>
                  <button
                    onClick={() => setShowBlockedFeedsConfig(false)}
                    className="px-4 py-2 bg-white border-2 border-slate-400 text-slate-700 text-sm rounded font-medium hover:bg-slate-50 transition"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand Memory Settings Modal */}
        {showBrandSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Brand Memory Settings</h2>
                <button
                  onClick={() => setShowBrandSettings(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Brand Guidelines */}
                <div>
                  <label className="block text-sm font-medium mb-2">Brand Guidelines *</label>
                  <p className="text-xs text-slate-600 mb-2">
                    Describe your brand voice, values, principles, desired patterns, prohibited patterns, terminology, and tone boundaries.
                  </p>
                  <textarea
                    value={brandGuidelines}
                    onChange={(e) => setBrandGuidelines(e.target.value)}
                    placeholder="e.g., Brand Voice: Technical but approachable, transparent, customer-first. Prohibited: Negative competitor mentions, controversial topics."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    rows={5}
                  />
                </div>

                {/* Terminology Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Terminology (Optional)</label>
                  <p className="text-xs text-slate-600 mb-3">Define key terms and their meanings to ensure consistency (e.g., "ETL" → "Extract, Transform, Load")</p>

                  {/* Existing Terminology */}
                  <div className="space-y-2 mb-3 bg-slate-50 p-3 rounded border border-slate-200">
                    {Object.keys(terminology).length > 0 ? (
                      Object.entries(terminology).map(([term, explanation]) => (
                        <div key={term} className="flex justify-between items-start gap-3 p-2 bg-white rounded border border-slate-100">
                          <div className="flex-1">
                            <span className="font-semibold text-slate-900">{term}</span>
                            <span className="text-slate-600 text-xs"> → {explanation}</span>
                          </div>
                          <button
                            onClick={() => {
                              const updated = { ...terminology };
                              delete updated[term];
                              setTerminology(updated);
                            }}
                            className="text-red-600 hover:text-red-900 font-bold flex-shrink-0 text-lg leading-none"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-3">No terminology defined yet</p>
                    )}
                  </div>

                  {/* Add New Terminology */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="Term (e.g., ETL, API, workflow)"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={newTermExplanation}
                      onChange={(e) => setNewTermExplanation(e.target.value)}
                      placeholder="Explanation (e.g., Extract, Transform, and Load data processes)"
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        if (newTerm.trim() && newTermExplanation.trim()) {
                          setTerminology({ ...terminology, [newTerm]: newTermExplanation });
                          setNewTerm('');
                          setNewTermExplanation('');
                        }
                      }}
                      disabled={!newTerm.trim() || !newTermExplanation.trim()}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm rounded font-medium transition"
                    >
                      + Add Term
                    </button>
                  </div>
                </div>

                {/* Exemplars Section */}
                <div className="space-y-6">
                  {/* Strong Exemplars Column */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-green-700">✓ Strong Exemplars</label>
                    <p className="text-xs text-slate-600 mb-3">Examples of writing that align with your brand</p>

                    {/* Existing Strong Exemplars */}
                    <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded">
                      {strongExemplars.map((exemplar, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-300 rounded-full text-xs whitespace-nowrap"
                        >
                          <span className="truncate max-w-xs">{exemplar}</span>
                          <button
                            onClick={() => setStrongExemplars(strongExemplars.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-900 font-medium ml-0.5 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {strongExemplars.length === 0 && (
                        <p className="text-xs text-slate-400 italic w-full text-center py-2">No strong exemplars added yet</p>
                      )}
                    </div>

                    {/* Input for Strong Exemplars */}
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={newStrongExemplar}
                        onChange={(e) => setNewStrongExemplar(e.target.value)}
                        placeholder="e.g., Clear, actionable insights with real examples..."
                        className="w-full px-2 py-1 border border-green-300 rounded text-xs"
                        rows={3}
                      />
                      <button
                        onClick={() => {
                          if (newStrongExemplar.trim()) {
                            setStrongExemplars([...strongExemplars, newStrongExemplar]);
                            setNewStrongExemplar('');
                          }
                        }}
                        disabled={!newStrongExemplar.trim()}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-xs rounded font-medium transition w-fit"
                      >
                        + Add Strong Example
                      </button>
                    </div>
                  </div>

                  {/* Weak Exemplars Column */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-red-700">✗ Weak Exemplars</label>
                    <p className="text-xs text-slate-600 mb-3">Examples of writing that doesn't align with brand</p>

                    {/* Existing Weak Exemplars */}
                    <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded">
                      {weakExemplars.map((exemplar, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-300 rounded-full text-xs whitespace-nowrap"
                        >
                          <span className="truncate max-w-xs">{exemplar}</span>
                          <button
                            onClick={() => setWeakExemplars(weakExemplars.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-900 font-medium ml-0.5 flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {weakExemplars.length === 0 && (
                        <p className="text-xs text-slate-400 italic w-full text-center py-2">No weak exemplars added yet</p>
                      )}
                    </div>

                    {/* Input for Weak Exemplars */}
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={newWeakExemplar}
                        onChange={(e) => setNewWeakExemplar(e.target.value)}
                        placeholder="e.g., Generic AI-generated tone, vague jargon..."
                        className="w-full px-2 py-1 border border-red-300 rounded text-xs"
                        rows={3}
                      />
                      <button
                        onClick={() => {
                          if (newWeakExemplar.trim()) {
                            setWeakExemplars([...weakExemplars, newWeakExemplar]);
                            setNewWeakExemplar('');
                          }
                        }}
                        disabled={!newWeakExemplar.trim()}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs rounded font-medium transition w-fit"
                      >
                        + Add Weak Example
                      </button>
                    </div>
                  </div>
                </div>

                {/* Structured Voice Profile Fields */}
                <div className="border-t pt-6 space-y-6">
                  <h3 className="text-sm font-semibold text-slate-900">Structured Voice Profile (Optional)</h3>

                  {/* Principles */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Principles</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {principles.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
                          {p}
                          <button onClick={() => setPrinciples(principles.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-900">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newPrinciple} onChange={(e) => setNewPrinciple(e.target.value)} placeholder="e.g., Evidence-backed content" className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs" />
                      <button onClick={() => { if (newPrinciple.trim()) { setPrinciples([...principles, newPrinciple]); setNewPrinciple(''); } }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium">Add</button>
                    </div>
                  </div>

                  {/* Desired Patterns */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Desired Patterns</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {desiredPatterns.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
                          {p}
                          <button onClick={() => setDesiredPatterns(desiredPatterns.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-900">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newDesiredPattern} onChange={(e) => setNewDesiredPattern(e.target.value)} placeholder="e.g., Use real examples" className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs" />
                      <button onClick={() => { if (newDesiredPattern.trim()) { setDesiredPatterns([...desiredPatterns, newDesiredPattern]); setNewDesiredPattern(''); } }} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-medium">Add</button>
                    </div>
                  </div>

                  {/* Prohibited Patterns */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Prohibited Patterns</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {prohibitedPatterns.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs">
                          {p}
                          <button onClick={() => setProhibitedPatterns(prohibitedPatterns.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-900">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newProhibitedPattern} onChange={(e) => setNewProhibitedPattern(e.target.value)} placeholder="e.g., Hype language" className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs" />
                      <button onClick={() => { if (newProhibitedPattern.trim()) { setProhibitedPatterns([...prohibitedPatterns, newProhibitedPattern]); setNewProhibitedPattern(''); } }} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-medium">Add</button>
                    </div>
                  </div>

                  {/* Tone Boundaries */}
                  <div>
                    <label className="block text-xs font-medium mb-2">Tone Boundaries</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {toneBoundaries.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs">
                          {t}
                          <button onClick={() => setToneBoundaries(toneBoundaries.filter((_, j) => j !== i))} className="text-red-600 hover:text-red-900">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newToneBoundary} onChange={(e) => setNewToneBoundary(e.target.value)} placeholder="e.g., Professional but approachable" className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs" />
                      <button onClick={() => { if (newToneBoundary.trim()) { setToneBoundaries([...toneBoundaries, newToneBoundary]); setNewToneBoundary(''); } }} className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium">Add</button>
                    </div>
                  </div>

                </div>

                {/* Approval Status */}
                <div className={`p-3 rounded border ${
                  brandApprovalStatus === 'approved'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-xs font-medium ${
                    brandApprovalStatus === 'approved'
                      ? 'text-green-900'
                      : 'text-blue-900'
                  }`}>
                    {brandApprovalStatus === 'approved'
                      ? '✓ Brand profile approved! Sources are now scored against this profile.'
                      : '⏳ Brand profile pending marketer approval. Scoring will begin after approval.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={async () => {
                      if (!brandGuidelines.trim()) {
                        setError('Please enter brand guidelines before approving');
                        return;
                      }

                      setIsSavingBrandProfile(true);

                      try {
                        const response = await fetch('/api/knowledge/brand-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            workspaceId,
                            guidelines: brandGuidelines,
                            strongExemplars,
                            weakExemplars,
                            // Structured voice profile
                            principles,
                            desiredPatterns,
                            prohibitedPatterns,
                            toneBoundaries,
                            terminology,
                            approvalStatus: 'approved',
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setBrandApprovalStatus('approved');
                          setError('');
                          setToast({
                            message: '✓ Brand profile saved & sources rescored!',
                            type: 'success',
                          });
                          console.log('✓ Brand profile approved:', data.message);

                          // Rescore all existing sources with the new brand profile
                          if (sources.length > 0) {
                            try {
                              const updatedSources = await Promise.all(
                                sources.map(async (source) => {
                                  const scoreRes = await fetch(
                                    '/api/knowledge/sources/brand-score',
                                    {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        strategyId,
                                        sourceTitle: source.title,
                                        fetchedContent: source.fetchedContent,
                                        sourceContent:
                                          source.transcriptText ||
                                          source.description ||
                                          source.canonicalUrl ||
                                          '',
                                        sourceType: source.type,
                                      }),
                                    }
                                  );

                                  if (scoreRes.ok) {
                                    const scoreData = await scoreRes.json();
                                    const updatedSource = {
                                      ...source,
                                      brandAlignmentScore: scoreData.alignmentScore,
                                      brandAlignmentLevel: scoreData.alignmentLevel,
                                      brandMatchedRules: scoreData.matchedRules,
                                      brandViolatedRules: scoreData.violatedRules,
                                    };

                                    // Save brand alignment to backend
                                    try {
                                      await fetch(`/api/knowledge/sources/${source.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          brandAlignmentScore: scoreData.alignmentScore,
                                          brandAlignmentLevel: scoreData.alignmentLevel,
                                          brandMatchedRules: scoreData.matchedRules,
                                          brandViolatedRules: scoreData.violatedRules,
                                        }),
                                      });
                                    } catch (err) {
                                      console.error('Error saving brand alignment:', err);
                                    }

                                    return updatedSource;
                                  }
                                  return source;
                                })
                              );
                              setSources(updatedSources);
                            } catch (err) {
                              console.error('Error rescoring sources:', err);
                            }
                          }

                          // Close modal on success
                          setTimeout(() => {
                            setShowBrandSettings(false);
                          }, 500);
                        } else {
                          setError('Failed to approve brand profile');
                          setToast({
                            message: '❌ Failed to save brand profile',
                            type: 'error',
                          });
                        }
                      } catch (err) {
                        setError('Error approving brand profile: ' + (err as Error).message);
                      } finally {
                        setIsSavingBrandProfile(false);
                      }
                    }}
                    disabled={!brandGuidelines.trim() || isSavingBrandProfile}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm rounded font-medium transition flex items-center justify-center gap-2"
                  >
                    {isSavingBrandProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      (brandApprovalStatus === 'approved'
                        ? '✓ Update Profile & Rescore'
                        : '✓ Approve & Activate Profile')
                    )}
                  </button>
                  <button
                    onClick={() => setShowBrandSettings(false)}
                    className="px-4 py-2 bg-white border-2 border-slate-400 text-slate-700 text-sm rounded font-medium hover:bg-slate-50 transition"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Source?"
          message="This will remove the source and all associated data. This action cannot be undone."
          itemName={sourceToDelete?.title || ''}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={confirmDeleteSource}
          onCancel={() => {
            setShowDeleteModal(false);
            setSourceToDelete(null);
            setDeleteError('');
          }}
        />
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <KnowledgeContent />
    </Suspense>
  );
}
