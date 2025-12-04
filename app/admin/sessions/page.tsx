'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { ExamSession, Profile } from '@/types';

interface SessionWithDetails extends ExamSession {
  exam_title?: string;
  student_name?: string;
  student_email?: string;
  alert_count?: number;
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  const flaggedFilter = searchParams.get('flagged') === 'true';

  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'started_at' | 'integrity_score'>('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSessions();
  }, [statusFilter, flaggedFilter, sortBy, sortOrder]);

  async function loadSessions() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getUserProfile(user.id);
      if (!profile || !['admin', 'proctor'].includes(profile.role)) {
        router.push('/dashboard');
        return;
      }

      let query = supabase
        .from('exam_sessions')
        .select(`
          *,
          exams!inner(title),
          profiles!inner(display_name, email)
        `);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (flaggedFilter) {
        query = query.lt('integrity_score', 0.7);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;
      if (error) throw error;

      const enrichedSessions: SessionWithDetails[] = await Promise.all(
        (data || []).map(async (session: any) => {
          const { count } = await supabase
            .from('suspicious_snapshots')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            exam_title: session.exams?.title,
            student_name: session.profiles?.display_name,
            student_email: session.profiles?.email,
            alert_count: count || 0,
          };
        })
      );

      setSessions(enrichedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exam Sessions</h1>
              <p className="text-sm text-gray-600 mt-1">{sessions.length} sessions found</p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter || 'all'}
                onChange={(e) => {
                  const value = e.target.value === 'all' ? null : e.target.value;
                  const params = new URLSearchParams(searchParams);
                  if (value) params.set('status', value);
                  else params.delete('status');
                  router.push(`/admin/sessions?${params.toString()}`);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="aborted">Aborted</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="started_at">Start Time</option>
                <option value="integrity_score">Integrity Score</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flaggedFilter}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.checked) params.set('flagged', 'true');
                    else params.delete('flagged');
                    router.push(`/admin/sessions?${params.toString()}`);
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Show only flagged</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Integrity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.student_name}</div>
                        <div className="text-sm text-gray-500">{session.student_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.exam_title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(session.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        session.integrity_score >= 0.7 ? 'text-green-600' :
                        session.integrity_score >= 0.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(session.integrity_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        (session.alert_count || 0) > 5 ? 'text-red-600' :
                        (session.alert_count || 0) > 0 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {session.alert_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => router.push(`/admin/session/${session.id}`)}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        Details
                      </button>
                      {session.status === 'in_progress' && (
                        <button
                          onClick={() => router.push(`/admin/viewer/${session.id}`)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Live View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
