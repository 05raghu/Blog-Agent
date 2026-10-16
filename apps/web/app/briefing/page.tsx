'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import { extractInsights } from '@/lib/briefing-insights';

interface SMEProfile {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  expertise: string[];
  capacityHoursPerMonth: number;
}

interface Topic {
  id: string;
  strategyId?: string;
  title: string;
  summary?: string;
  angle?: string;
}

interface BriefingSession {
  id: string;
  workspaceId?: string;
  strategyId: string;
  topicId: string;
  topicTitle: string;
  smeId: string;
  smeName: string;
  status: 'not_started' | 'in_progress' | 'completed';
  questions: Array<{
    id: string;
    text: string;
    order: number;
  }>;
  responses: Record<string, string>; // questionId -> answer
  startedAt?: string;
  completedAt?: string;
}

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    text: 'What is the most common misconception about this topic?',
    order: 1,
  },
  {
    id: 'q2',
    text: 'What are the key best practices or approaches?',
    order: 2,
  },
  {
    id: 'q3',
    text: 'Can you share a real-world example or case study?',
    order: 3,
  },
  {
    id: 'q4',
    text: 'What are the common pitfalls to avoid?',
    order: 4,
  },
  {
    id: 'q5',
    text: 'What tools or resources do you recommend?',
    order: 5,
  },
];

function BriefingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspaceId, user, loading: authLoading } = useWorkspace();
  const strategyId = searchParams?.get('strategyId');
  const topicId = searchParams?.get('topicId');
  const smeId = searchParams?.get('smeId');

  // All hooks must be declared before any conditional returns
  const [sessions, setSessions] = useState<BriefingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<BriefingSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [smes, setSmes] = useState<SMEProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSME, setSelectedSME] = useState<SMEProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<BriefingSession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoLinkMessage, setAutoLinkMessage] = useState('');

  const startNewSession = async (topic: Topic, sme: SMEProfile) => {
    try {
      const sessionData = {
        topicId: topic.id,
        topicTitle: topic.title,
        smeId: sme.id,
        smeName: sme.name,
        status: 'in_progress' as const,
        questions: DEFAULT_QUESTIONS,
        responses: {},
        startedAt: new Date().toISOString(),
      };

      // Create via API
      const response = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: strategyId || 'default-strategy',
          session: sessionData,
          action: 'create',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newSession = result.session;
        setCurrentSession(newSession);
        const updated = [newSession, ...sessions];
        setSessions(updated);
        localStorage.setItem('briefing_sessions', JSON.stringify(updated));
      }
    } catch (err) {
      setError('Failed to create briefing session');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load from localStorage (source of truth)
      const stored = localStorage.getItem('briefing_sessions');
      let sessionsData: BriefingSession[] = [];

      if (stored) {
        const allSessions = JSON.parse(stored);
        sessionsData = allSessions.filter((s: BriefingSession) => s.strategyId === strategyId);
      }

      setSessions(sessionsData);

      // Also try API to sync (in-memory store may have more recent data)
      try {
        const apiResponse = await fetch(`/api/briefing?strategyId=${strategyId}`);
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          const apiSessions = data.sessions || [];

          // If API has data, use it and update localStorage
          if (apiSessions.length > 0) {
            setSessions(apiSessions);
            const allSessions = localStorage.getItem('briefing_sessions')
              ? JSON.parse(localStorage.getItem('briefing_sessions') || '[]')
              : [];
            const filtered = allSessions.filter((s: BriefingSession) => s.workspaceId !== workspaceId);
            const updated = [...filtered, ...apiSessions];
            localStorage.setItem('briefing_sessions', JSON.stringify(updated));
          }
        }
      } catch (apiErr) {
        // If API fails, continue with localStorage data
        console.log('API unavailable, using localStorage');
      }
      // Fetch topics from API
      let fetchedTopics: Topic[] = [];
      try {
        const topicsResponse = await fetch(`/api/strategy/topics?strategyId=${strategyId}`);
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          fetchedTopics = topicsData.topics || [];
          setTopics(fetchedTopics);
        }
      } catch (err) {
        console.log('Failed to fetch topics');
      }

      // Fetch SMEs from API
      let fetchedSMEs: SMEProfile[] = [];
      try {
        const smesResponse = await fetch('/api/sme');
        if (smesResponse.ok) {
          const smesData = await smesResponse.json();
          fetchedSMEs = smesData.smes || [];
          setSmes(fetchedSMEs);
        }
      } catch (err) {
        console.log('Failed to fetch SMEs');
      }

      // If topic and SME are in URL, load that session or create new one
      if (topicId && smeId) {
        const topic = fetchedTopics.find((t: Topic) => t.id === topicId);
        const sme = fetchedSMEs.find((s: SMEProfile) => s.id === smeId);
        if (topic && sme) {
          setSelectedTopic(topic);
          setSelectedSME(sme);
          startNewSession(topic, sme);
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (strategyId) {
      loadData();
    }
  }, [strategyId, workspaceId]);

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

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      responses: {
        ...currentSession.responses,
        [questionId]: answer,
      },
    };
    setCurrentSession(updated);
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;

    const completed = {
      ...currentSession,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    };

    try {
      // Update via API
      const response = await fetch('/api/briefing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: strategyId || 'default-strategy',
          sessionId: completed.id,
          session: completed,
        }),
      });

      if (response.ok) {
        const updatedSessions = sessions.map((s) => (s.id === completed.id ? completed : s));
        setSessions(updatedSessions);
        localStorage.setItem('briefing_sessions', JSON.stringify(updatedSessions));

        // Auto-link: Extract insights and update linked articles
        try {
          const questionsData = completed.questions || DEFAULT_QUESTIONS;
          const briefingInsights = extractInsights(completed.responses || {}, questionsData);

          console.log('[Briefing] Session completed - Starting auto-link:', {
            sessionId: completed.id,
            smeId: completed.smeId,
            strategyId,
          });

          // Find articles linked to this SME in the same strategy
          // These are articles that either:
          // 1. Already have this briefing session ID
          // 2. Have this SME assigned but no briefing insights yet
          const articlesResponse = await fetch(`/api/articles?strategyId=${strategyId}`);
          console.log('[Briefing] Articles API response status:', articlesResponse.status);

          if (articlesResponse.ok) {
            const articlesData = await articlesResponse.json();
            console.log('[Briefing] All articles fetched:', articlesData.articles?.length);
            console.log('[Briefing] Article details:', articlesData.articles?.map((a: any) => ({
              id: a.id,
              title: a.title,
              assignedSmeId: a.assignedSmeId,
              briefingInsights: a.briefingInsights,
            })));

            const linkedArticles = (articlesData.articles || []).filter(
              (a: any) => a.assignedSmeId === completed.smeId
            );

            console.log('[Briefing] Articles with this SME assigned:', linkedArticles.length);

            // Update each article with the extracted insights
            let successCount = 0;
            for (const article of linkedArticles) {
              try {
                const updateResponse = await fetch('/api/articles/update-briefing-insights', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    articleId: article.id,
                    briefingSessionId: completed.id,
                    briefingInsights,
                  }),
                });

                if (updateResponse.ok) {
                  successCount++;
                  console.log(`[Briefing] Updated insights for article ${article.id}`);
                } else {
                  console.error(`[Briefing] Failed to update article ${article.id}:`, updateResponse.status);
                }
              } catch (updateErr) {
                console.error(`[Briefing] Error updating article ${article.id}:`, updateErr);
              }
            }

            console.log('[Briefing] Update complete. Success count:', successCount);
            if (successCount > 0) {
              setAutoLinkMessage(
                `✓ Briefing insights updated for ${successCount} article(s) with this SME.`
              );
            } else if (linkedArticles.length === 0) {
              console.log('[Briefing] No articles found with this SME assigned');
            } else {
              console.log('[Briefing] Articles found but updates failed - check errors above');
            }
          }
        } catch (linkErr) {
          console.error('Auto-linking failed:', linkErr);
          // Don't show error to user if auto-linking fails - session is still complete
        }
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    }

    setTimeout(() => {
      setCurrentSession(null);
      setCurrentQuestionIndex(0);
      setShowStartForm(false);
      setSelectedTopic(null);
      setSelectedSME(null);
    }, 500);
  };


  const handleDeleteSession = (session: BriefingSession) => {
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setIsDeleting(true);
      // Delete via API
      const response = await fetch(
        `/api/briefing?strategyId=${strategyId}&sessionId=${sessionToDelete.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        const updated = sessions.filter((s) => s.id !== sessionToDelete.id);
        setSessions(updated);
        localStorage.setItem('briefing_sessions', JSON.stringify(updated));
        setShowDeleteModal(false);
        setSessionToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSession = (session: BriefingSession) => {
    setCurrentSession(session);
    setCurrentQuestionIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-lg">Loading briefing data...</p>
        </div>
      </div>
    );
  }

  // Currently in a session
  if (currentSession) {
    const currentQuestion =
      currentQuestionIndex < currentSession.questions.length
        ? currentSession.questions[currentQuestionIndex]
        : null;

    const isLastQuestion = currentQuestionIndex === currentSession.questions.length - 1;

    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-ink-950">SME Briefing Session</h1>
              <button
                onClick={() => {
                  setCurrentSession(null);
                  setCurrentQuestionIndex(0);
                  setShowStartForm(false);
                  setSelectedTopic(null);
                  setSelectedSME(null);
                }}
                className="btn-secondary text-sm"
              >
                ← Back to Sessions
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-600">Topic</p>
                <p className="font-semibold text-ink-950">{currentSession.topicTitle}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">SME</p>
                <p className="font-semibold text-ink-950">{currentSession.smeName}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-slate-700">
                Question {currentQuestionIndex + 1} of {currentSession.questions.length}
              </p>
              <p className="text-sm text-slate-600">
                {Object.keys(currentSession.responses).length}/{currentSession.questions.length} answered
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-signal h-2 rounded-full transition-all"
                style={{
                  width: `${(currentQuestionIndex / currentSession.questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {currentQuestion ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-ink-950 mb-4">
                {currentQuestion.text}
                <span className="text-red-600 ml-1">*</span>
              </h2>
              <textarea
                value={currentSession.responses[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerQuestion(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                rows={5}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded text-sm mb-4"
              />
              <p className="text-xs text-slate-500 mb-4">All questions are required to complete this session.</p>
              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                {isLastQuestion ? (
                  <button
                    onClick={handleCompleteSession}
                    disabled={!currentSession.responses[currentQuestion.id]?.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!currentSession.responses[currentQuestion.id]?.trim() ? 'Answer this question first' : 'Complete the session'}
                  >
                    ✓ Complete
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    disabled={!currentSession.responses[currentQuestion.id]?.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!currentSession.responses[currentQuestion.id]?.trim() ? 'Answer this question first' : 'Move to next question'}
                  >
                    Next →
                  </button>
                )}
              </div>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
              <div className="text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 className="text-2xl font-bold text-ink-950 mb-2">Session Complete!</h2>
                <p className="text-slate-600 mb-4">All answers recorded. Session has been saved.</p>
              </div>
              {autoLinkMessage && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 font-medium text-center">{autoLinkMessage}</p>
                  <p className="text-green-700 text-sm text-center mt-1">
                    The linked articles are now ready for draft generation with SME insights.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sidebar: Answered Questions */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-bold text-ink-950 mb-3">Your Answers</h3>
            <div className="space-y-2">
              {currentSession.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-full text-left p-2 rounded text-sm cursor-pointer transition-all ${idx === currentQuestionIndex
                    ? 'bg-signal text-white border border-signal'
                    : currentSession.responses[q.id]
                      ? 'bg-green-50 border border-green-200 text-green-900 hover:bg-green-100'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <p className="font-medium">Q{idx + 1} {idx === currentQuestionIndex && '←'}</p>
                  {currentSession.responses[q.id] && (
                    <p className="text-xs mt-1 line-clamp-2">{currentSession.responses[q.id]}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session list view
  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink-950 mb-2">SME Briefing Sessions</h1>
          <p className="text-lg text-slate-600">Conduct one-on-one interviews with your SMEs</p>
        </div>


        <div className="mb-6 flex gap-3">
          <Link
            href={strategyId ? `/topics?strategyId=${strategyId}` : '/topics'}
            className="btn-secondary text-sm"
          >
            ← Back to Topics
          </Link>
          <Link
            href={strategyId ? `/sme?strategyId=${strategyId}` : '/sme'}
            className="btn-secondary text-sm"
          >
            → Manage SMEs
          </Link>
        </div>

        {!showStartForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowStartForm(true)}
              disabled={topics.length === 0 || smes.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              title={topics.length === 0 || smes.length === 0 ? 'Add at least one topic and one SME to start a session' : 'Start a new briefing session'}
            >
              + Start New Briefing Session
            </button>

          </div>
        )}

        {showStartForm && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold mb-4">Select Topic & SME</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Topic</label>
                <select
                  value={selectedTopic?.id || ''}
                  onChange={(e) => {
                    const topic = topics.find((t) => t.id === e.target.value);
                    setSelectedTopic(topic || null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="">Select a topic...</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">SME</label>
                <select
                  value={selectedSME?.id || ''}
                  onChange={(e) => {
                    const sme = smes.find((s) => s.id === e.target.value);
                    setSelectedSME(sme || null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                >
                  <option value="">Select an SME...</option>
                  {smes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selectedTopic && selectedSME) {
                    startNewSession(selectedTopic, selectedSME);
                  }
                }}
                disabled={!selectedTopic || !selectedSME}
                className="btn-primary flex-1"
              >
                ✓ Start Interview
              </button>
              <button
                onClick={() => {
                  setShowStartForm(false);
                  setSelectedTopic(null);
                  setSelectedSME(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Previous Sessions */}
        {sessions.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">All Sessions</h3>
            {sessions.map((session) => (
              <div key={session.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-ink-950">{session.topicTitle}</h4>
                    <p className="text-sm text-slate-600">with {session.smeName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSession(session)}
                      className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-all"
                      title="Continue editing this session"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session)}
                      className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-all"
                      title="Delete this session"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Status</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${session.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {session.status === 'completed' ? '✓ Completed' : '⏳ In Progress'}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-600">Progress</p>
                    <p className="font-semibold text-ink-950">
                      {Object.keys(session.responses).length}/{session.questions.length} answered
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">Completion</p>
                    <p className="font-semibold text-ink-950">
                      {session.completedAt ? new Date(session.completedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No briefing sessions yet</div>
            <div className="empty-state-description">Start a new session to interview an SME</div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && sessionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <h3 className="text-lg font-bold text-slate-900">Delete Session?</h3>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-3">
                  This will remove the session and all responses. This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-900">
                    "{sessionToDelete.topicTitle}" with {sessionToDelete.smeName}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSessionToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSession}
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
      </div>
    </div>
  );
}

export default function BriefingPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <BriefingContent />
    </Suspense>
  );
}
