'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STAGE_LABELS, STAGE_COLORS, validateTransition, type ArticleStage } from '@blog-agent/domain';

interface Article {
  id: string;
  contentId: string;
  title: string;
  brief: string;
  outline: string;
  status: string;
  topicId: string;
  strategyId: string;
  assignedSME: string | null;
  owner: string;
  plannedPublishDate: string | null;
  wordCount: number;
  pausedReason: string | null;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ArticleDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      setArticle(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!article) return;

    const validation = validateTransition(article.status as ArticleStage, newStatus as ArticleStage);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      const updated = await response.json();
      setArticle((prev) =>
        prev ? { ...prev, status: updated.status, updatedAt: updated.updatedAt } : null
      );
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin mb-4 text-4xl">⚙</div>
            <p className="text-lg font-medium">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-parchment">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="error-message mb-8">
            <span className="error-message-icon">⚠</span>
            <span className="error-message-text">{error || 'Article not found'}</span>
          </div>
          <Link href="/calendar" className="btn-secondary">
            Back to Calendar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-hero mb-4" style={{ fontSize: '46px' }}>
              {article.title}
            </h1>
            <p className="lead text-slate-700">
              Content ID: {article.contentId.substring(0, 20)}...
            </p>
          </div>
          <Link href="/calendar" className="btn-secondary text-sm">
            Back to Calendar
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="error-message mb-8">
            <span className="error-message-icon">⚠</span>
            <span className="error-message-text">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Rail */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Workflow Status</h3>
              <div
                className="inline-block px-4 py-2 rounded-lg text-white font-medium"
                style={{
                  backgroundColor:
                    STAGE_COLORS[article.status as keyof typeof STAGE_COLORS] || '#6B7280',
                }}
              >
                {STAGE_LABELS[article.status as keyof typeof STAGE_LABELS] ||
                  article.status}
              </div>

              {/* Status Reason */}
              {article.pausedReason && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                  <strong>Paused:</strong> {article.pausedReason}
                </div>
              )}
              {article.blockedReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <strong>Blocked:</strong> {article.blockedReason}
                </div>
              )}
            </div>

            {/* Brief & Outline */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Brief</h3>
              <p className="text-slate-700 mb-6">{article.brief || 'No brief provided'}</p>

              <h3 className="font-medium mb-4">Outline</h3>
              <div
                className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap font-body"
                style={{ fontSize: '14px' }}
              >
                {article.outline || 'No outline provided'}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Actions</h3>
              <div className="space-y-2">
                {article.status === 'NOT_STARTED' && (
                  <button
                    onClick={() => updateStatus('QUEUED')}
                    disabled={updatingStatus}
                    className="btn-primary w-full"
                  >
                    {updatingStatus ? '⏳ Queuing...' : '▶ Start Work'}
                  </button>
                )}
                {article.status === 'WORKING' && (
                  <>
                    <button
                      onClick={() => updateStatus('READY_FOR_REVIEW')}
                      disabled={updatingStatus}
                      className="btn-primary w-full"
                    >
                      {updatingStatus ? '⏳ Submitting...' : '✓ Ready for Review'}
                    </button>
                    <button
                      onClick={() => updateStatus('PAUSED')}
                      disabled={updatingStatus}
                      className="btn-secondary w-full"
                    >
                      {updatingStatus ? '⏳ Pausing...' : '⏸ Pause Work'}
                    </button>
                  </>
                )}
                {article.status === 'READY_FOR_REVIEW' && (
                  <>
                    <button
                      onClick={() => updateStatus('APPROVED')}
                      disabled={updatingStatus}
                      className="btn-primary w-full"
                    >
                      {updatingStatus ? '⏳ Approving...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => updateStatus('CHANGES_REQUESTED')}
                      disabled={updatingStatus}
                      className="btn-secondary w-full"
                    >
                      {updatingStatus ? '⏳ Requesting...' : '📝 Request Changes'}
                    </button>
                  </>
                )}
                {article.status === 'CHANGES_REQUESTED' && (
                  <button
                    onClick={() => updateStatus('WORKING')}
                    disabled={updatingStatus}
                    className="btn-primary w-full"
                  >
                    {updatingStatus ? '⏳ Resuming...' : '▶ Resume Work'}
                  </button>
                )}
                {!['APPROVED', 'CANCELLED'].includes(article.status) && (
                  <button
                    onClick={() => updateStatus('CANCELLED')}
                    disabled={updatingStatus}
                    className="btn-secondary w-full text-red-600"
                  >
                    {updatingStatus ? '⏳ Cancelling...' : '✕ Cancel Article'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-600">Word Count</dt>
                  <dd className="font-medium">{article.wordCount} words</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Owner</dt>
                  <dd className="font-medium">{article.owner}</dd>
                </div>
                <div>
                  <dt className="text-slate-600">Assigned SME</dt>
                  <dd className="font-medium">{article.assignedSME || 'Unassigned'}</dd>
                </div>
                {article.plannedPublishDate && (
                  <div>
                    <dt className="text-slate-600">Publish Date</dt>
                    <dd className="font-medium">
                      {new Date(article.plannedPublishDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-600">Created</dt>
                  <dd className="font-medium">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-600">Last Updated</dt>
                  <dd className="font-medium">
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Topic Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium mb-4">Topic</h3>
              <p className="text-sm text-slate-600 mb-3">
                Topic ID: {article.topicId.substring(0, 20)}...
              </p>
              <Link href={`/topics?strategyId=${article.strategyId}`} className="btn-secondary w-full text-sm">
                View All Topics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
