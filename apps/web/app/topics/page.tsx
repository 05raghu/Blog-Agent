'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';

interface Topic {
  id: string;
  strategyId?: string;
  title: string;
  summary: string;
  format: string;
  angle?: string;
  targetOffering?: string;
  geography?: string;
  audience?: string;
  score: number;
  confidence: number;
  source?: 'ai' | 'manual';
  assignedSmeId?: string;
  assignedSmeName?: string;
  breakdown: {
    strategicRelevance: { score: number; evidence: string };
    audienceIcpUsefulness: { score: number; evidence: string };
    availableEvidenceAndDemand: { score: number; evidence: string };
    differentiatedAngle: { score: number; evidence: string };
    smeFit: { score: number; evidence: string };
    searchContentGap: { score: number; evidence: string };
    conversionDistributionPotential: { score: number; evidence: string };
  };
  cannibalizationRisk: { exists: boolean; message?: string };
  recommendedSmes: Array<{ name: string; fitScore: number; reason: string }>;
  missingInputs: string[];
  createdAt: string;
}

function TopicsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const strategyId = searchParams?.get('strategyId');
  const { workspaceId, user, loading: authLoading } = useWorkspace();

  // All hooks must be declared before any conditional returns
  const [topics, setTopics] = useState<Topic[]>([]);
  const [smes, setSmes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingArticle, setCreatingArticle] = useState<string | null>(null);
  const [approvedTopics, setApprovedTopics] = useState<Set<string>>(new Set());
  const [topicsWithArticles, setTopicsWithArticles] = useState<Set<string>>(new Set());
  const [topicToArticleMap, setTopicToArticleMap] = useState<Map<string, string>>(new Map());
  const [showSmeAssignmentModal, setShowSmeAssignmentModal] = useState(false);
  const [topicForSmeAssignment, setTopicForSmeAssignment] = useState<Topic | null>(null);
  const [selectedSmeId, setSelectedSmeId] = useState<string>('');
  const [recommendedSmes, setRecommendedSmes] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'bulk'>('manual');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    angle: '',
    targetOffering: '',
    format: 'blog' as 'blog' | 'guide' | 'case_study' | 'whitepaper',
    geography: '',
    audience: '',
  });
  const [strategyData, setStrategyData] = useState<any>(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [seedText, setSeedText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    summary: '',
    angle: '',
    targetOffering: '',
    format: 'blog' as 'blog' | 'guide' | 'case_study' | 'whitepaper',
    geography: '',
    audience: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'topic-only' | 'with-articles'>('topic-only');

  // All hooks must come BEFORE conditional returns
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Auto-scroll to top when error appears
  useEffect(() => {
    if (error) {
      console.log('[ERROR]', error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Show success toast and auto-clear
  useEffect(() => {
    if (!success) return;

    console.log('[SUCCESS]', success);
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!strategyId) {
      setError('No strategy ID provided');
      setLoading(false);
      return;
    }

    // Restore approval state from localStorage
    const savedApprovals = localStorage.getItem(`approvals_${strategyId}`);
    if (savedApprovals) {
      setApprovedTopics(new Set(JSON.parse(savedApprovals)));
    }

    fetchTopics();
  }, [strategyId]);

  // NOW we can have conditional returns
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

  const fetchTopics = async () => {
    try {
      setLoading(true);

      // Try to get strategy from localStorage first
      let strategyData;
      const cached = localStorage.getItem(`strategy_${strategyId}`);

      if (cached) {
        strategyData = JSON.parse(cached);
      } else {
        // Fallback: fetch from API
        const strategyResponse = await fetch(`/api/strategy?id=${strategyId}`);
        if (!strategyResponse.ok) {
          throw new Error('Strategy not found. Create one first at /strategy');
        }
        strategyData = await strategyResponse.json();
      }

      // Store strategy data for form use
      setStrategyData(strategyData);

      // Fetch existing articles for this strategy
      const articlesResponse = await fetch(`/api/articles?strategyId=${strategyId}`);
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        const topicIds: Set<string> = new Set(articlesData.articles.map((a: any) => a.topicId as string));
        const topicToArticle = new Map<string, string>();
        articlesData.articles.forEach((a: any) => {
          topicToArticle.set(a.topicId as string, a.id as string);
        });
        setTopicsWithArticles(topicIds);
        setTopicToArticleMap(topicToArticle);
      }

      // Load from localStorage first (source of truth)
      const cachedTopics = localStorage.getItem('topics');
      let topicsData: Topic[] = [];

      if (cachedTopics) {
        const parsed = JSON.parse(cachedTopics);
        topicsData = parsed.filter((t: Topic) => t.strategyId === strategyId);
      }

      setTopics(topicsData);

      // Also try API to sync (in-memory store may have more recent data)
      try {
        const topicsResponse = await fetch(`/api/strategy/topics?strategyId=${strategyId}`);
        if (topicsResponse.ok) {
          const data = await topicsResponse.json();
          const apiTopics = (data.topics || []).map((t: Topic) => ({
            ...t,
            strategyId: strategyId,
          }));

          // If API has data, use it and update localStorage
          if (apiTopics.length > 0) {
            setTopics(apiTopics);
            localStorage.setItem('topics', JSON.stringify(apiTopics));
          }
        }
      } catch (apiErr) {
        // If API fails, continue with localStorage data
        console.log('API unavailable, using localStorage');
      }

      // Load SMEs for this workspace
      try {
        const smeResponse = await fetch(`/api/sme?workspaceId=${workspaceId}`);
        if (smeResponse.ok) {
          const smeData = await smeResponse.json();
          setSmes(smeData.smes.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (smeErr) {
        console.log('Failed to load SMEs');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTopic = async (topic: Topic) => {
    if (!approvedTopics.has(topic.id)) {
      // Show SME assignment modal when approving
      setTopicForSmeAssignment(topic);
      setSelectedSmeId(topic.assignedSmeId || '');
      setShowSmeAssignmentModal(true);

      // Fetch SME recommendations
      await fetchSmeRecommendations(topic);
    } else {
      // Unapprove
      setApprovedTopics((prev) => {
        const updated = new Set(prev);
        updated.delete(topic.id);
        localStorage.setItem(`approvals_${strategyId}`, JSON.stringify(Array.from(updated)));
        return updated;
      });
    }
  };

  const fetchSmeRecommendations = async (topic: Topic) => {
    try {
      setLoadingRecommendations(true);
      const response = await fetch('/api/sme/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          topic: {
            title: topic.title,
            summary: topic.summary,
            angle: topic.angle,
            targetOffering: topic.targetOffering,
            format: topic.format,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedSmes(data.recommendations || []);

        // Auto-select top recommendation if not already assigned
        if (data.recommendations?.length > 0 && !topic.assignedSmeId) {
          setSelectedSmeId(data.recommendations[0].smeId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch SME recommendations:', err);
      setRecommendedSmes([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleAssignSme = () => {
    if (!topicForSmeAssignment) return;

    const selectedSme = smes.find((s) => s.id === selectedSmeId);
    const updatedTopic = {
      ...topicForSmeAssignment,
      assignedSmeId: selectedSmeId,
      assignedSmeName: selectedSme?.name,
    };

    // Update topic in state
    setTopics((prev) =>
      prev.map((t) => (t.id === updatedTopic.id ? updatedTopic : t))
    );

    // Update localStorage
    const cachedTopics = localStorage.getItem('topics') || '[]';
    const parsed = JSON.parse(cachedTopics);
    const updated = parsed.map((t: Topic) =>
      t.id === updatedTopic.id ? updatedTopic : t
    );
    localStorage.setItem('topics', JSON.stringify(updated));

    // Mark as approved
    setApprovedTopics((prev) => {
      const newSet = new Set(prev);
      newSet.add(updatedTopic.id);
      localStorage.setItem(`approvals_${strategyId}`, JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    setShowSmeAssignmentModal(false);
    setTopicForSmeAssignment(null);
    setSelectedSmeId('');
    setSuccess(`Topic approved and assigned to ${selectedSme?.name || 'SME'}`);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyId || !strategyData) return;

    try {
      setCreatingTopic(true);
      setError('');

      if (!formData.title.trim()) {
        setError('Topic title is required');
        setCreatingTopic(false);
        return;
      }

      const response = await fetch('/api/strategy/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          strategy: {
            offerings: strategyData.offerings,
            targetIcps: strategyData.targetIcps,
            geographies: strategyData.geographies,
            competitors: strategyData.competitors,
            contentMix: strategyData.contentMix,
          },
          action: 'create',
          topic: {
            title: formData.title,
            summary: formData.summary || undefined,
            angle: formData.angle || undefined,
            targetOffering: formData.targetOffering || undefined,
            format: formData.format,
            geography: formData.geography || undefined,
            audience: formData.audience || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create topic');
      }

      const data = await response.json();

      // Add the new topic to the list (with strategyId and source)
      setTopics((prev) => {
        const topicWithStrategy = {
          ...data.topic,
          strategyId: strategyId, // Add strategyId for filtering
          source: 'manual' as const, // Mark as manually created
        };
        const updated = [topicWithStrategy, ...prev].sort((a, b) => b.score - a.score);
        // Save to localStorage
        localStorage.setItem('topics', JSON.stringify(updated));
        return updated;
      });

      // Reset form
      setFormData({
        title: '',
        summary: '',
        angle: '',
        targetOffering: '',
        format: 'blog',
        geography: '',
        audience: '',
      });
      setShowCreateForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingTopic(false);
    }
  };

  // Parse CSV file
  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header row and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  // Parse JSON file
  const parseJSON = (text: string): any[] => {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('JSON must be an array of topic objects');
    return data;
  };

  // Handle bulk upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !strategyId || !strategyData) return;

    try {
      setCreatingTopic(true);
      setError('');
      setUploadProgress('Reading file...');

      const fileText = await uploadFile.text();
      let topicsData: any[] = [];

      // Determine file type and parse
      if (uploadFile.name.endsWith('.csv')) {
        topicsData = parseCSV(fileText);
      } else if (uploadFile.name.endsWith('.json')) {
        topicsData = parseJSON(fileText);
      } else {
        throw new Error('File must be CSV or JSON format');
      }

      if (topicsData.length === 0) throw new Error('No topics found in file');

      setUploadProgress(`Processing ${topicsData.length} topics...`);

      // Create topics one by one
      let createdCount = 0;
      const newTopics: Topic[] = [];

      for (let i = 0; i < topicsData.length; i++) {
        const topicData = topicsData[i];
        setUploadProgress(`Creating topic ${i + 1} of ${topicsData.length}...`);

        const response = await fetch('/api/strategy/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategyId,
            strategy: {
              offerings: strategyData.offerings,
              targetIcps: strategyData.targetIcps,
              geographies: strategyData.geographies,
              competitors: strategyData.competitors,
              contentMix: strategyData.contentMix,
            },
            action: 'create',
            topic: {
              title: topicData.title || '',
              summary: topicData.summary || undefined,
              angle: topicData.angle || undefined,
              targetOffering: topicData.targetOffering || undefined,
              format: topicData.format || 'blog',
              geography: topicData.geography || undefined,
              audience: topicData.audience || undefined,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          newTopics.push({
            ...data.topic,
            strategyId,
            source: 'manual' as const,
          });
          createdCount++;
        }
      }

      // Update topics list
      setTopics((prev) => {
        const updated = [
          ...newTopics,
          ...prev
        ].sort((a, b) => b.score - a.score);
        localStorage.setItem('topics', JSON.stringify(updated));
        return updated;
      });

      setSuccess(`✓ Successfully created ${createdCount} of ${topicsData.length} topics`);
      setUploadFile(null);
      setCreateMode('manual');
      setShowCreateForm(false);
      setUploadProgress('');
    } catch (err) {
      setError((err as Error).message);
      setUploadProgress('');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleGenerateTopics = async () => {
    if (!strategyId) return;

    try {
      setGeneratingTopics(true);
      setError('');

      const response = await fetch('/api/strategy/topics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          seed: seedText.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate topics');
      }

      const data = await response.json();

      // Update topics list with new generated topics
      const newTopics = (data.generated || []).map((t: Topic) => ({
        ...t,
        strategyId,
        source: 'ai' as const, // Mark as AI-generated
      }));

      setTopics((prev) => {
        const updated = [...newTopics, ...prev].sort((a, b) => b.score - a.score);
        localStorage.setItem('topics', JSON.stringify(updated));
        return updated;
      });

      const generated = data.generated?.length || 0;
      const requested = data.requested || 10;
      if (generated < requested) {
        setSuccess(`✓ Generated ${generated} of ${requested} requested topics`);
      } else {
        setSuccess(`✓ Generated ${generated} topic candidates`);
      }

      setSeedText('');
      setShowGenerateForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGeneratingTopics(false);
    }
  };

  const handleCreateArticle = async (topic: Topic) => {
    if (!strategyId) return;

    try {
      setCreatingArticle(topic.id);
      setError('');

      let brief = topic.summary;

      // If topic doesn't have a summary, generate one from title
      if (!brief || brief.trim() === '') {
        const briefResponse = await fetch('/api/articles/generate-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: topic.title,
            angle: topic.angle,
            targetOffering: topic.targetOffering,
          }),
        });

        if (briefResponse.ok) {
          const briefData = await briefResponse.json();
          brief = briefData.brief;
        }
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          strategyId,
          title: topic.title,
          brief: brief || 'Brief to be determined',
          outline: '',
          assignedSmeId: topic.assignedSmeId || null,
          assignedSmeName: topic.assignedSmeName || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create article');
      }

      const data = await response.json();
      // Redirect to article editor
      window.location.href = `/articles/${data.id}/editor?strategyId=${strategyId}`;
    } catch (err) {
      setError((err as Error).message);
      setCreatingArticle(null);
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setEditFormData({
      title: topic.title,
      summary: topic.summary,
      angle: topic.angle || '',
      targetOffering: topic.targetOffering || '',
      format: (topic.format as any) || 'blog',
      geography: topic.geography || '',
      audience: topic.audience || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEditedTopic = async () => {
    if (!editingTopic || !strategyId || !strategyData) return;

    try {
      setError('');

      // Call API to edit and recalculate score (SERVER-SIDE)
      const response = await fetch('/api/strategy/topics/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: editingTopic.id,
          strategyId,
          strategy: {
            offerings: strategyData.offerings,
            targetIcps: strategyData.targetIcps,
            geographies: strategyData.geographies,
            competitors: strategyData.competitors,
            contentMix: strategyData.contentMix,
          },
          topic: {
            title: editFormData.title,
            summary: editFormData.summary || undefined,
            angle: editFormData.angle || undefined,
            targetOffering: editFormData.targetOffering || undefined,
            format: editFormData.format,
            geography: editFormData.geography || undefined,
            audience: editFormData.audience || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update topic');
      }

      const data = await response.json();

      // Update the topic in the list with the returned scored data
      const updatedTopics = topics.map((t) =>
        t.id === editingTopic.id ? data.topic : t
      );

      // Re-sort by score
      updatedTopics.sort((a, b) => b.score - a.score);
      setTopics(updatedTopics);
      // Save to localStorage
      localStorage.setItem('topics', JSON.stringify(updatedTopics));
      setShowEditModal(false);
      setEditingTopic(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    setTopicToDelete(topic);
    setShowDeleteModal(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete || !strategyId) return;

    try {
      setIsDeleting(true);

      // Delete from local state and localStorage
      const updated = topics.filter((t) => t.id !== topicToDelete.id);
      setTopics(updated);
      localStorage.setItem('topics', JSON.stringify(updated));

      // Remove from approved topics if it was approved
      const updatedApprovals = new Set(approvedTopics);
      updatedApprovals.delete(topicToDelete.id);
      setApprovedTopics(updatedApprovals);
      localStorage.setItem(`approvals_${strategyId}`, JSON.stringify(Array.from(updatedApprovals)));

      // Also try to delete from API (for AI-generated topics)
      try {
        await fetch(`/api/strategy/topics/${topicToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategyId }),
        });
      } catch (apiErr) {
        // API delete failed, but local delete succeeded
        console.log('API delete failed, but local topic was deleted:', apiErr);
      }

      // If user chose to delete articles too, delete associated articles
      if (deleteOption === 'with-articles' && topicToArticleMap.has(topicToDelete.id)) {
        const articleId = topicToArticleMap.get(topicToDelete.id);
        if (articleId) {
          try {
            await fetch(`/api/articles/${articleId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });
          } catch (apiErr) {
            console.log('Failed to delete associated article:', apiErr);
          }
        }
      }

      setShowDeleteModal(false);
      setTopicToDelete(null);
      setDeleteOption('topic-only');

      // Show success toast
      const message = deleteOption === 'with-articles'
        ? `✓ "${topicToDelete.title}" and associated article deleted`
        : `✓ "${topicToDelete.title}" deleted successfully`;
      setSuccess(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Generating topic candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-hero" style={{ fontSize: '40px', marginTop: "2px" }}>
                Topic Candidates
              </h1>
              {strategyData && (
                <p className="text-sm text-slate-700 mt-2">
                  Strategy: <span className="text-blue-600 font-semibold">{strategyData.offerings?.join(', ') || strategyData.title}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link href={`/knowledge?strategyId=${strategyId}`} className="btn-secondary text-sm">
                📚 Knowledge Base
              </Link>
              <Link href={`/briefing?strategyId=${strategyId}`} className="btn-secondary text-sm">
                💬 SME Briefing
              </Link>
              <Link href={`/sme?strategyId=${strategyId}`} className="btn-secondary text-sm">
                👥 Manage SMEs
              </Link>
              <Link href="/strategy" className="btn-secondary text-sm">
                Strategies
              </Link>
            </div>
          </div>
        </div>

        {/* Create Topic Form */}
        <div className="mb-8 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex justify-between items-center ">
            <h3 className=" font-bold">Create New Topic</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-secondary text-sm"
            >
              {showCreateForm ? '✕ Cancel' : '+ New Topic'}
            </button>
          </div>

          {showCreateForm && (
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 border-b pb-3">
                <button
                  type="button"
                  onClick={() => setCreateMode('manual')}
                  className={`px-4 py-2 rounded font-medium text-sm transition ${
                    createMode === 'manual'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✏️ Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setCreateMode('bulk')}
                  className={`px-4 py-2 rounded font-medium text-sm transition ${
                    createMode === 'bulk'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📤 Bulk Upload
                </button>
              </div>

              {/* Manual Entry Mode */}
              {createMode === 'manual' && (
            <form onSubmit={handleCreateTopic} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., How to Build Scalable APIs"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief description of the topic..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              {/* Grid: Angle, Offering, Format */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Angle</label>
                  <input
                    type="text"
                    value={formData.angle}
                    onChange={(e) => setFormData({ ...formData, angle: e.target.value })}
                    placeholder="e.g., Best practices, vs comparison"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Target Offering</label>
                  <select
                    value={formData.targetOffering}
                    onChange={(e) => setFormData({ ...formData, targetOffering: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  >
                    <option value="">Select offering...</option>
                    {strategyData?.offerings?.map((offering: string) => (
                      <option key={offering} value={offering}>
                        {offering}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  >
                    <option value="blog">Blog</option>
                    <option value="guide">Guide</option>
                    <option value="case_study">Case Study</option>
                    <option value="whitepaper">Whitepaper</option>
                  </select>
                </div>
              </div>

              {/* Grid: Geography, Audience */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Geography</label>
                  <input
                    type="text"
                    value={formData.geography}
                    onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
                    placeholder="e.g., North America, Global"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Audience</label>
                  <input
                    type="text"
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    placeholder="e.g., Engineering leaders, CTOs"
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="btn-primary flex items-center gap-2"
                >
                  {creatingTopic ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    '✓ Create Topic'
                  )}
                </button>
              </div>
            </form>
              )}

              {/* Bulk Upload Mode */}
              {createMode === 'bulk' && (
                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">Upload File (CSV or JSON)</label>
                    <p className="text-xs text-slate-600 mb-3">
                      📋 CSV: Columns should be: title, summary, angle, targetOffering, format, geography, audience<br/>
                      📋 JSON: Array of objects with the same fields
                    </p>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="topic-file"
                      />
                      <label htmlFor="topic-file" className="cursor-pointer block">
                        {uploadFile ? (
                          <div>
                            <p className="text-sm font-medium text-blue-600">✓ {uploadFile.name}</p>
                            <p className="text-xs text-slate-600 mt-1">Click to change file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-slate-900">📤 Click to select file or drag and drop</p>
                            <p className="text-xs text-slate-600 mt-1">CSV or JSON format supported</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-900">{uploadProgress}</p>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={!uploadFile || creatingTopic}
                      className="btn-primary flex items-center gap-2 flex-1 justify-center"
                    >
                      {creatingTopic ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {uploadProgress || 'Uploading...'}
                        </>
                      ) : (
                        '📤 Upload Topics'
                      )}
                    </button>
                  </div>

                  {/* Example Section */}
                  <details className="pt-4 border-t">
                    <summary className="cursor-pointer font-medium text-sm text-slate-700 hover:text-slate-900">
                      📝 Example CSV Format
                    </summary>
                    <pre className="mt-3 p-3 bg-slate-50 rounded text-xs overflow-x-auto">
{`title,summary,angle,targetOffering,format,geography,audience
Kubernetes Guide,Container orchestration basics,Beginner,DevOps,guide,Global,DevOps Engineers
API Security Best Practices,Secure your APIs,Advanced,Security,guide,North America,Security Teams`}
                    </pre>
                  </details>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Generate Topics Form */}
        <div className="mb-8 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">✨ Generate Topics with AI</h3>
            <button
              onClick={() => setShowGenerateForm(!showGenerateForm)}
              className="btn-secondary text-sm"
            >
              {showGenerateForm ? '✕ Cancel' : '✨ Generate Topics'}
            </button>
          </div>

          {showGenerateForm && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Seed / Focus (optional)
                </label>
                <textarea
                  value={seedText}
                  onChange={(e) => setSeedText(e.target.value)}
                  placeholder="e.g., Focus on migration from legacy systems — or leave blank to generate purely from your strategy"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                />
              </div>

              <button
                onClick={handleGenerateTopics}
                disabled={generatingTopics}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {generatingTopics ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating 10 topics...
                  </>
                ) : (
                  '✨ Generate 10 Topics'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-message mb-8">
            <span className="error-message-icon">⚠</span>
            <span className="error-message-text">{error}</span>
          </div>
        )}

        {/* Success Toast */}
        {success && (
          <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 animate-in fade-in slide-in-from-right duration-300 max-w-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span className="text-green-800 font-medium">{success}</span>
            </div>
          </div>
        )}

        {/* Topics Grid */}
        {topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 items-start flex-1">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-editorial text-lg mb-1">{topic.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{topic.summary}</p>
                    <div className="flex gap-3 items-center flex-wrap">
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                        {topic.format}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                        topic.source === 'ai'
                          ? 'bg-purple-100 text-purple-700'
                          : topic.source === 'manual'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {topic.source === 'ai' && '✨ AI Generated'}
                        {topic.source === 'manual' && '✋ Manual'}
                        {!topic.source && '📝 Unknown'}
                      </span>
                    </div>
                    </div>
                  </div>

                  {/* Score Card */}
                  <div className="ml-6">
                    <div className="bg-gradient-to-br from-signal to-azure rounded-lg p-6 text-center min-w-32">
                      <div className="text-4xl font-bold text-ink-950 mb-1">{topic.score}</div>
                      <div className="text-xs font-medium text-ink-950">Score</div>
                    </div>
                  </div>
                </div>

                {/* Rubric Breakdown (PRD P0.1) */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Scoring Breakdown</div>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.strategicRelevance?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Strategic<br />Relevance</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.strategicRelevance?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.audienceIcpUsefulness?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Audience/<br />ICP</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.audienceIcpUsefulness?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.availableEvidenceAndDemand?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Evidence &<br />Demand</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.availableEvidenceAndDemand?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.differentiatedAngle?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Differentiated<br />Angle</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.differentiatedAngle?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.smeFit?.score || 0}</div>
                      <div className="text-slate-600 text-xs">SME Fit</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.smeFit?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.searchContentGap?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Search<br />Gap</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.searchContentGap?.evidence || ''}</div>
                    </div>
                    <div className="bg-slate-50 rounded p-2 border border-slate-200">
                      <div className="font-bold text-ink-950">{topic.breakdown.conversionDistributionPotential?.score || 0}</div>
                      <div className="text-slate-600 text-xs">Conversion<br />Potential</div>
                      <div className="text-slate-500 text-xs mt-1 italic">{topic.breakdown.conversionDistributionPotential?.evidence || ''}</div>
                    </div>
                  </div>

                  {/* Confidence & Missing Inputs */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-700 font-medium">Confidence:</span>
                      <span className="font-bold text-ink-950">{topic.confidence || 0}%</span>
                    </div>
                    {topic.missingInputs && topic.missingInputs.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <div className="text-xs font-medium text-yellow-900 mb-1">Missing Inputs:</div>
                        <ul className="text-xs text-yellow-800 space-y-1">
                          {topic.missingInputs.map((input: string, idx: number) => (
                            <li key={idx}>• {input}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Cannibalization Risk */}
                  {topic.cannibalizationRisk?.exists && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
                      <div className="text-xs font-medium text-red-900">⚠️ Cannibalization Risk</div>
                      <div className="text-xs text-red-800">{topic.cannibalizationRisk.message}</div>
                    </div>
                  )}

                  {/* Assigned SME */}
                  {topic.assignedSmeName && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                      <div className="text-xs font-medium text-green-900">👤 Assigned SME: {topic.assignedSmeName}</div>
                    </div>
                  )}

                  {/* Recommended SMEs */}
                  {topic.recommendedSmes && topic.recommendedSmes.length > 0 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="text-xs font-medium text-blue-900 mb-1">Recommended SMEs:</div>
                      {topic.recommendedSmes.map((sme: any, idx: number) => (
                        <div key={idx} className="text-xs text-blue-800 mb-1">
                          <div className="font-medium">{sme.name}</div>
                          <div className="text-xs">{sme.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (topicsWithArticles.has(topic.id)) {
                          const articleId = topicToArticleMap.get(topic.id);
                          if (articleId) {
                            window.location.href = `/articles/${articleId}/editor?strategyId=${strategyId}`;
                          }
                        } else {
                          handleApproveTopic(topic);
                        }
                      }}
                      className={`text-sm font-medium px-4 py-2 rounded transition-all ${topicsWithArticles.has(topic.id)
                        ? 'btn-secondary text-signal'
                        : approvedTopics.has(topic.id)
                          ? 'btn-secondary text-signal'
                          : 'btn-primary'
                        }`}
                    >
                      {topicsWithArticles.has(topic.id) ? '✓ Has Article' : approvedTopics.has(topic.id) ? '✓ Approved' : '✓ Approve Topic'}
                    </button>
                    <button
                      onClick={() => handleCreateArticle(topic)}
                      disabled={!approvedTopics.has(topic.id) || creatingArticle === topic.id || topicsWithArticles.has(topic.id)}
                      className={`text-sm font-medium px-4 py-2 rounded transition-all ${topicsWithArticles.has(topic.id) || !approvedTopics.has(topic.id)
                        ? 'btn-secondary text-slate-400 cursor-not-allowed opacity-50'
                        : 'btn-primary'
                        }`}
                    >
                      {topicsWithArticles.has(topic.id) ? '✓ Article Created' : creatingArticle === topic.id ? '⏳ Creating...' : '→ Create Article'}
                    </button>
                  </div>

                  {/* Edit & Delete Icons - Right Corner */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-all"
                      title="Edit topic"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all"
                      title="Delete topic"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No topics generated</div>
            <div className="empty-state-description">
              {error ? 'Try creating a new strategy' : 'Topics will appear here'}
            </div>

          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Topic</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveEditedTopic(); }} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Summary</label>
                  <textarea
                    value={editFormData.summary}
                    onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                  />
                </div>

                {/* Grid: Angle, Offering, Format */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Angle</label>
                    <input
                      type="text"
                      value={editFormData.angle}
                      onChange={(e) => setEditFormData({ ...editFormData, angle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Target Offering</label>
                    <select
                      value={editFormData.targetOffering}
                      onChange={(e) => setEditFormData({ ...editFormData, targetOffering: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="">Select offering...</option>
                      {strategyData?.offerings?.map((offering: string) => (
                        <option key={offering} value={offering}>
                          {offering}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Format</label>
                    <select
                      value={editFormData.format}
                      onChange={(e) => setEditFormData({ ...editFormData, format: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="blog">Blog</option>
                      <option value="guide">Guide</option>
                      <option value="case_study">Case Study</option>
                      <option value="whitepaper">Whitepaper</option>
                    </select>
                  </div>
                </div>

                {/* Grid: Geography, Audience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Geography</label>
                    <input
                      type="text"
                      value={editFormData.geography}
                      onChange={(e) => setEditFormData({ ...editFormData, geography: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Audience</label>
                    <input
                      type="text"
                      value={editFormData.audience}
                      onChange={(e) => setEditFormData({ ...editFormData, audience: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-2"
                  >
                    ✓ Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {/* Delete Confirmation Modal */}
        {showDeleteModal && topicToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <h3 className="text-lg font-bold text-slate-900">Delete Topic?</h3>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-3">
                  {topicToArticleMap.has(topicToDelete.id)
                    ? 'This topic has an associated article. How would you like to proceed?'
                    : 'This will remove the topic. This action cannot be undone.'}
                </p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-900">
                    "{topicToDelete.title}"
                  </p>
                </div>
              </div>

              {/* Options for topics with articles */}
              {topicToArticleMap.has(topicToDelete.id) && (
                <div className="mb-6 space-y-3">
                  <label className="flex items-center p-3 border-2 border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: deleteOption === 'topic-only' ? '#3b82f6' : '#e2e8f0'}}>
                    <input
                      type="radio"
                      name="deleteOption"
                      value="topic-only"
                      checked={deleteOption === 'topic-only'}
                      onChange={(e) => setDeleteOption(e.target.value as 'topic-only' | 'with-articles')}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Delete Topic Only</p>
                      <p className="text-xs text-slate-600">Keep the associated article</p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border-2 border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: deleteOption === 'with-articles' ? '#3b82f6' : '#e2e8f0'}}>
                    <input
                      type="radio"
                      name="deleteOption"
                      value="with-articles"
                      checked={deleteOption === 'with-articles'}
                      onChange={(e) => setDeleteOption(e.target.value as 'topic-only' | 'with-articles')}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Delete Topic & Article</p>
                      <p className="text-xs text-slate-600">Remove both topic and associated article</p>
                    </div>
                  </label>
                </div>
              )}

              <p className="text-xs text-slate-500 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTopicToDelete(null);
                    setDeleteOption('topic-only');
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTopic}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    '🗑️ Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SME Assignment Modal - with Recommendations */}
        {showSmeAssignmentModal && topicForSmeAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Assign SME to Topic</h3>
                  <p className="text-slate-600 text-sm mt-1">
                    <strong>{topicForSmeAssignment.title}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSmeAssignmentModal(false);
                    setTopicForSmeAssignment(null);
                    setSelectedSmeId('');
                    setRecommendedSmes([]);
                  }}
                  className="text-slate-500 hover:text-slate-700 text-2xl font-light"
                >
                  ✕
                </button>
              </div>

              {loadingRecommendations && (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-signal rounded-full animate-spin"></div>
                  <p className="text-slate-600 mt-2 text-sm">Analyzing expertise fit...</p>
                </div>
              )}

              {!loadingRecommendations && recommendedSmes.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-sm font-medium text-slate-700">
                    System Recommendations ({recommendedSmes.length} available):
                  </p>

                  {recommendedSmes.map((rec, idx) => (
                    <label
                      key={rec.smeId}
                      className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSmeId === rec.smeId
                          ? 'border-signal bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex gap-3">
                        <input
                          type="radio"
                          name="sme"
                          value={rec.smeId}
                          checked={selectedSmeId === rec.smeId}
                          onChange={(e) => setSelectedSmeId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-slate-900">
                                #{idx + 1} {rec.smeName}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-signal">{rec.fitScore}%</div>
                              <div className="text-xs text-slate-600">fit score</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-slate-50 rounded p-2 border border-slate-200">
                              <div className="text-xs text-slate-600">Topic Fit</div>
                              <div className="font-bold text-slate-900">{rec.topicFitScore}</div>
                            </div>
                            <div className="bg-slate-50 rounded p-2 border border-slate-200">
                              <div className="text-xs text-slate-600">Availability</div>
                              <div className="font-bold text-slate-900">{rec.availabilityScore}</div>
                            </div>
                            <div className="bg-slate-50 rounded p-2 border border-slate-200">
                              <div className="text-xs text-slate-600">Experience</div>
                              <div className="font-bold text-slate-900">{rec.priorWorkScore}</div>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            <div>✓ {rec.reasoning.topicFit}</div>
                            <div>⏱ {rec.reasoning.availability}</div>
                            <div>📚 {rec.reasoning.priorWork}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {!loadingRecommendations && recommendedSmes.length === 0 && smes.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-sm text-yellow-800">
                  <strong>No SMEs available.</strong> Create SME profiles first at <a href={`/sme?strategyId=${strategyId}`} className="font-medium text-signal hover:underline">/sme →</a>
                </div>
              )}

              {!loadingRecommendations && recommendedSmes.length === 0 && smes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
                  <strong>No strong matches found.</strong> Available SMEs don't closely match this topic. You can still select one manually or create a more specialized SME.
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSmeAssignmentModal(false);
                    setTopicForSmeAssignment(null);
                    setSelectedSmeId('');
                    setRecommendedSmes([]);
                  }}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSme}
                  disabled={!selectedSmeId}
                  className={`px-4 py-2 rounded text-white transition-all ${
                    selectedSmeId
                      ? 'bg-signal hover:bg-blue-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  ✓ Approve & Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {/* <div className="mt-12 pt-8 border-t border-slate-300 text-center text-sm text-slate-600">
          <p>Strategy ID: {strategyId?.substring(0, 20)}...</p>
        </div> */}
      </div>
    </div>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-parchment">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Loading topics...</p>
          </div>
        </div>
      </div>
    }>
      <TopicsContent />
    </Suspense>
  );
}
