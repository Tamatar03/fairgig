import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();
    const { answers } = body;

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session
    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Get final integrity score and alert count
    const { count: alertCount } = await supabase
      .from('suspicious_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    return NextResponse.json({
      success: true,
      integrity_score: session.integrity_score,
      flagged_events: alertCount || 0,
    });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
