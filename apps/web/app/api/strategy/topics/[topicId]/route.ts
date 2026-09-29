// API route: DELETE /api/strategy/topics/[topicId] — Delete a topic

import { NextRequest, NextResponse } from 'next/server';
import { topicStore } from '@/lib/topic-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const body = await request.json();
    const { strategyId } = body;
    const { topicId } = params;

    if (!strategyId || !topicId) {
      return NextResponse.json(
        { error: 'strategyId and topicId are required' },
        { status: 400 }
      );
    }

    // Get current topics for this strategy
    const topics = topicStore.get(strategyId) || [];

    // Filter out the topic to delete
    const updatedTopics = topics.filter((t: any) => t.id !== topicId);

    // Update the store with the filtered list
    topicStore.set(strategyId, updatedTopics);

    return NextResponse.json({
      success: true,
      message: `Topic ${topicId} deleted successfully`,
      topicCount: updatedTopics.length,
      topics: updatedTopics,
    });
  } catch (error) {
    console.error('[API] Topic deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic', message: (error as Error).message },
      { status: 500 }
    );
  }
}
