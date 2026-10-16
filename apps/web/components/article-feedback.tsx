'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';

interface Comment {
  id: string;
  content: string;
  commentType: 'blocker' | 'suggestion' | 'praise';
  section?: string;
  authorId: string;
  isResolved: boolean;
  createdAt: string;
}

interface ArticleFeedbackProps {
  articleId: string;
  articleStatus: string;
  comments: Comment[];
  userRole?: string;
  onCommentAdded?: () => void;
}

export function ArticleFeedback({
  articleId,
  articleStatus,
  comments,
  userRole: propUserRole,
  onCommentAdded,
}: ArticleFeedbackProps) {
  const workspace = useWorkspace();
  const userRole = propUserRole || workspace.role || 'marketer';

  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'blocker' | 'suggestion' | 'praise'>('suggestion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);
  const [resolvingCommentId, setResolvingCommentId] = useState<string | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          commentType,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setCommentType('suggestion');
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSubmittingReview(true);
      const response = await fetch(`/api/articles/${articleId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
        }),
      });

      if (response.ok) {
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRequestChanges = async () => {
    try {
      setSubmittingReview(true);
      const response = await fetch(`/api/articles/${articleId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request-changes',
        }),
      });

      if (response.ok) {
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Failed to request changes:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmittingForReview(true);
      console.log('[Feedback] Submitting article for review...');

      const response = await fetch(`/api/articles/${articleId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
        }),
      });

      console.log('[Feedback] Response status:', response.status, 'ok:', response.ok);
      const data = await response.json();
      console.log('[Feedback] Response data:', data);

      if (response.ok) {
        console.log('[Feedback] Setting success toast...');
        setToast({ message: '✅ Article submitted for review!', type: 'success' });
        // Keep toast visible for longer before refreshing
        setTimeout(() => {
          console.log('[Feedback] Calling onCommentAdded and clearing toast...');
          onCommentAdded?.();
          setToast(null);
        }, 3000);
      } else {
        console.log('[Feedback] Setting error toast - response not ok');
        setToast({ message: '❌ Failed to submit article', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error('[Feedback] Failed to submit for review:', err);
      setToast({ message: '❌ Error submitting article', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmittingForReview(false);
    }
  };

  const handleResolveComment = async (commentId: string, resolve: boolean) => {
    try {
      setResolvingCommentId(commentId);
      const response = await fetch(`/api/articles/${articleId}/comments/${commentId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved: resolve,
        }),
      });

      if (response.ok) {
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Failed to resolve comment:', err);
    } finally {
      setResolvingCommentId(null);
    }
  };

  const fetchRevisionHistory = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/revisions`);
      if (response.ok) {
        const data = await response.json();
        setRevisionHistory(data.revisions || []);
      }
    } catch (err) {
      console.error('Failed to fetch revision history:', err);
    }
  };

  useEffect(() => {
    fetchRevisionHistory();
  }, [articleId]);

  const blockers = comments.filter((c) => c.commentType === 'blocker' && !c.isResolved);
  const suggestions = comments.filter((c) => c.commentType === 'suggestion' && !c.isResolved);
  const resolved = comments.filter((c) => c.isResolved);

  // Role-based access control
  const isReviewer = userRole && ['editor', 'reviewer', 'admin'].includes(userRole);

  const canApprove = articleStatus === 'READY_FOR_REVIEW' && isReviewer;

  // Get readable role name
  const getRoleBadge = (): { text: string; bg: string; color: string } => {
    switch (userRole) {
      case 'admin':
        return { text: 'Admin', bg: 'bg-purple-100', color: 'text-purple-700' };
      case 'editor':
      case 'reviewer':
        return { text: 'Reviewer', bg: 'bg-blue-100', color: 'text-blue-700' };
      case 'marketer':
      case 'sme':
        return { text: 'Author', bg: 'bg-green-100', color: 'text-green-700' };
      default:
        return { text: 'Viewer', bg: 'bg-gray-100', color: 'text-gray-700' };
    }
  };

  // Extract email/name from stored format (userId|email)
  const extractUserInfo = (authorIdString: string): string => {
    if (!authorIdString) return 'Unknown';
    const parts = authorIdString.split('|');
    return parts[1] || parts[0]; // Return email if available, else user ID
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          data-testid="toast-notification"
          className={`fixed top-4 right-4 px-6 py-4 rounded-lg text-sm font-medium text-white z-50 shadow-lg animate-fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          style={{ minWidth: '300px' }}
        >
          {toast.message}
        </div>
      )}

      {/* Role Badge */}
      <div className="flex justify-end">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge().bg} ${getRoleBadge().color}`}>
          👤 {getRoleBadge().text}
        </div>
      </div>

      {/* Status & Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Review Status</h3>
            <p className="text-sm text-slate-600 mt-1 capitalize">
              {articleStatus === 'NOT_STARTED' && '📝 Ready to write'}
              {articleStatus === 'CHANGES_REQUESTED' && '🔄 Changes requested - revise and resubmit'}
              {articleStatus === 'READY_FOR_REVIEW' && '⏳ Awaiting reviewer feedback'}
              {articleStatus === 'APPROVED' && '✅ Approved!'}
            </p>
          </div>
        </div>

        {blockers.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-800">
              ⚠️ {blockers.length} blocker{blockers.length !== 1 ? 's' : ''} must be resolved
            </p>
          </div>
        )}

        {/* Author Submit for Review */}
        {(articleStatus === 'NOT_STARTED' || articleStatus === 'CHANGES_REQUESTED') && (
          <div className="mt-4">
            <button
              onClick={handleSubmitForReview}
              disabled={submittingForReview}
              className="btn-primary disabled:opacity-50 w-full"
            >
              {submittingForReview ? '⏳ Submitting for Review...' : '→ Submit for Review'}
            </button>
          </div>
        )}

        {/* Reviewer Approval Actions */}
        {canApprove && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleApprove}
              disabled={submittingReview}
              className="btn-primary disabled:opacity-50"
            >
              {submittingReview ? '⏳ Processing...' : '✅ Approve Article'}
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={submittingReview}
              className="btn-secondary disabled:opacity-50"
            >
              {submittingReview ? '⏳ Processing...' : '📝 Request Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Revision History Timeline */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-bold text-slate-900 mb-4">📋 Change History</h3>
        <div className="space-y-2 text-sm">
          {revisionHistory.length === 0 ? (
            <p className="text-slate-600">No changes yet. Submit for review to start the approval workflow.</p>
          ) : (
            revisionHistory.map((revision, index) => {
              let icon = '📝';
              if (revision.new_status === 'ready_for_review') icon = '⏳';
              if (revision.new_status === 'approved') icon = '✅';
              if (revision.new_status === 'changes_requested') icon = '🔄';

              let actionText = revision.description || 'Status updated';

              const createdAt = new Date(revision.created_at);
              const timeStr = createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={revision.id}
                  className={`flex items-start gap-3 ${index < revisionHistory.length - 1 ? 'pb-3 border-b border-slate-200' : ''}`}
                >
                  <div className="text-2xl">{icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{actionText}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500">
                        By <span className="font-medium text-slate-700">{extractUserInfo(revision.changed_by)}</span>
                      </p>
                      <p className="text-xs text-slate-500">{timeStr}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comments Summary */}
      {comments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Feedback ({comments.length})</h3>
          <div className="space-y-3">
            {blockers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Blockers ({blockers.length})</p>
                {blockers.map((comment) => (
                  <div key={comment.id} className="text-sm bg-red-50 border-l-2 border-red-400 pl-3 py-2 mb-2">
                    <p className="text-slate-900">{comment.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-600">
                        By <span className="font-medium text-slate-700">{extractUserInfo(comment.authorId)}</span>
                      </p>
                      <button
                        onClick={() => handleResolveComment(comment.id, true)}
                        disabled={resolvingCommentId === comment.id}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {resolvingCommentId === comment.id ? '✓ Marking...' : '✓ Mark Resolved'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Suggestions ({suggestions.length})</p>
                {suggestions.map((comment) => (
                  <div key={comment.id} className="text-sm bg-yellow-50 border-l-2 border-yellow-400 pl-3 py-2 mb-2">
                    <p className="text-slate-900">{comment.content}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-600">
                        By <span className="font-medium text-slate-700">{extractUserInfo(comment.authorId)}</span>
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resolved.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">Resolved ({resolved.length})</p>
                {resolved.map((comment) => (
                  <div key={comment.id} className="text-sm bg-green-50 border-l-2 border-green-400 pl-3 py-2 mb-2 opacity-80">
                    <p className="text-slate-900 line-through">{comment.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-600">
                        By <span className="font-medium text-slate-700">{extractUserInfo(comment.authorId)}</span>
                      </p>
                      <button
                        onClick={() => handleResolveComment(comment.id, false)}
                        disabled={resolvingCommentId === comment.id}
                        className="text-xs px-2 py-1 bg-slate-400 text-white rounded hover:bg-slate-500 transition-colors disabled:opacity-50"
                      >
                        {resolvingCommentId === comment.id ? 'Unmarking...' : 'Unresolve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Comment Form */}
      {articleStatus !== 'approved' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-4">Add Feedback</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
              >
                <option value="suggestion">💡 Suggestion</option>
                <option value="blocker">⚠️ Blocker</option>
                <option value="praise">✨ Praise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your feedback..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
              />
            </div>

            <button
              onClick={handleAddComment}
              disabled={isSubmitting || !newComment.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
