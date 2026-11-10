'use client';

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { GenUIErrorBoundary } from '@/lib/gen-ui/safe-renderer';

interface PerformanceDashboardStreamProps {
  articleId: string;
  onError?: (error: string) => void;
  demo?: boolean;
}

export function PerformanceDashboardStream({
  articleId,
  onError,
  demo = false,
}: PerformanceDashboardStreamProps) {
  const [componentJSX, setComponentJSX] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStreamProgress(0);
        bufferRef.current = '';

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/gen-ui/performance-dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId, demo }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate dashboard');
        }

        // Stream the response and accumulate JSX
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is not readable');

        const decoder = new TextDecoder();
        let totalBytesRead = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          bufferRef.current += decoder.decode(value, { stream: true });
          totalBytesRead += value.length;

          // Update progress and JSX
          setStreamProgress(Math.min(90, totalBytesRead / 100));
          setComponentJSX(bufferRef.current);
        }

        // Final flush
        bufferRef.current += decoder.decode();
        setComponentJSX(bufferRef.current);
        setStreamProgress(100);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const errorMessage = (err as Error).message || 'Unknown error';
          setError(errorMessage);
          onError?.(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [articleId, onError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-signal border-t-transparent mb-4"></div>
          <p className="text-slate-600">Generating dashboard...</p>
          {streamProgress > 0 && (
            <div className="mt-4 w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-signal transition-all"
                style={{ width: `${streamProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm font-medium text-red-800">Error generating dashboard</p>
        <p className="text-xs text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!componentJSX) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-sm text-slate-600">No dashboard data available</p>
      </div>
    );
  }

  return (
    <GenUIErrorBoundary>
      <div className="gen-ui-dashboard space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>⚠️ Gen UI Dashboard (MVP):</strong> Displaying AI-generated React components with streaming from Claude. Safe renderer being implemented.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h3 className="font-semibold text-slate-900 mb-3">Dashboard Layout</h3>
          <p className="text-sm text-slate-600 mb-3">
            Claude generated {componentJSX.split('\n').length} lines of JSX
          </p>

          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-slate-700 p-2 hover:bg-slate-100 rounded">
              View Generated JSX Code
            </summary>
            <pre className="mt-4 p-4 bg-slate-900 text-slate-100 rounded overflow-x-auto text-xs">
              {componentJSX.substring(0, 2000)}
              {componentJSX.length > 2000 && `\n... (${componentJSX.length - 2000} more characters)`}
            </pre>
          </details>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Streaming from Claude API working</li>
            <li>✓ JSX generation complete</li>
            <li>→ Integrating @babel/parser for safe JSX compilation</li>
            <li>→ Setting up sandboxed component rendering</li>
            <li>→ Building interactive dashboard components</li>
          </ul>
        </div>
      </div>
    </GenUIErrorBoundary>
  );
}
