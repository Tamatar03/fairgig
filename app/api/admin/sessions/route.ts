import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(user.id);
    if (!profile || !['admin', 'proctor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'started_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

    let query = supabase
      .from('exam_sessions')
      .select(`
        *,
        exams!inner(title),
        profiles!inner(display_name, email)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order(sort as any, { ascending: order === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const sessions = (data || []).map((session: any) => ({
      id: session.id,
      exam_id: session.exam_id,
      student_id: session.student_id,
      student_name: session.profiles?.display_name,
      student_email: session.profiles?.email,
      exam_title: session.exams?.title,
      status: session.status,
      integrity_score: session.integrity_score,
      started_at: session.started_at,
      ended_at: session.ended_at,
    }));

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
