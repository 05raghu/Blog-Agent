'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ArticleDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const strategyId = searchParams?.get('strategyId');

  useEffect(() => {
    if (id) {
      // Redirect to editor page
      const editorUrl = strategyId
        ? `/articles/${id}/editor?strategyId=${strategyId}`
        : `/articles/${id}/editor`;
      router.replace(editorUrl);
    }
  }, [id, strategyId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-signal rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading article...</p>
      </div>
    </div>
  );
}
