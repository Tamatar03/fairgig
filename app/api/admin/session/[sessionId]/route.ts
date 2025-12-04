import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(user.id);
    if (!profile || !['admin', 'proctor', 'support'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { sessionId } = params;

    // Get session with related data
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        exams!inner(id, title, duration_minutes),
        profiles!inner(id, email, display_name)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get cheat scores
    const { data: scores, error: scoresError } = await supabase
      .from('cheat_scores')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (scoresError) throw scoresError;

    // Get snapshots
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('suspicious_snapshots')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false });

    if (snapshotsError) throw snapshotsError;

    return NextResponse.json({
      session: {
        id: session.id,
        exam_id: session.exam_id,
        student_id: session.student_id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        status: session.status,
        integrity_score: session.integrity_score,
        degraded: session.degraded,
        device_info: session.device_info,
      },
      exam: session.exams,
      student: session.profiles,
      scores: scores || [],
      snapshots: snapshots || [],
      timeline: [
        {
          timestamp: session.started_at,
          type: 'status_change',
          data: { status: 'in_progress' },
        },
        ...(session.ended_at ? [{
          timestamp: session.ended_at,
          type: 'status_change',
          data: { status: session.status },
        }] : []),
      ],
    });
  } catch (error) {
    console.error('Admin session detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}
