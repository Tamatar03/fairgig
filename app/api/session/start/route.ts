import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exam_id, consent_given, device_info } = body;

    if (!exam_id || !consent_given) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new exam session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id,
        student_id: user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        device_info,
        integrity_score: 1.0,
      })
      .select()
      .single();

    if (error) throw error;

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError) throw examError;

    return NextResponse.json({
      session_id: session.id,
      exam,
      settings: {
        frameIntervalMs: 500,
        frameWidth: 640,
        frameHeight: 480,
        jpegQuality: 0.8,
      },
    });
  } catch (error) {
    console.error('Session start error:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}
