'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { ExamSession, Profile } from '@/types';

interface SessionWithDetails extends ExamSession {
  exam_title?: string;
  student_name?: string;
  student_email?: string;
  alert_count?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [stats, setStats] = useState({
    activeSessions: 0,
    completedToday: 0,
    flaggedSessions: 0,
    avgIntegrity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setError(null);
      console.log('Loading admin dashboard...');
      
      const user = await getCurrentUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      const userProfile = await getUserProfile(user.id);
      console.log('User profile:', userProfile);
      
      if (!userProfile || !['admin', 'proctor'].includes(userProfile.role)) {
        setError(`Access denied. Admin or proctor role required. Your role: ${userProfile?.role || 'none'}`);
        setLoading(false);
        return;
      }

      setProfile(userProfile);

      // Load recent sessions with details
      const { data: sessionsData, error } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          exams!inner(title),
          profiles!inner(display_name, email)
        `)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Transform and enrich session data
      const enrichedSessions: SessionWithDetails[] = await Promise.all(
        (sessionsData || []).map(async (session: any) => {
          // Count alerts for this session
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

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const activeSessions = enrichedSessions.filter(s => s.status === 'in_progress').length;
      const completedToday = enrichedSessions.filter(s => 
        s.status === 'completed' && 
        new Date(s.ended_at || s.started_at) >= todayStart
      ).length;
      const flaggedSessions = enrichedSessions.filter(s => s.integrity_score < 0.7).length;
      const avgIntegrity = enrichedSessions.reduce((sum, s) => sum + s.integrity_score, 0) / 
        (enrichedSessions.length || 1);

      setStats({
        activeSessions,
        completedToday,
        flaggedSessions,
        avgIntegrity,
      });
    } catch (error: any) {
      console.error('Failed to load admin dashboard:', error);
      setError(error.message || 'Failed to load dashboard data. Make sure you ran schema-complete.sql in Supabase.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-2xl font-bold mb-4">⚠️ Error Loading Admin Dashboard</div>
          <p className="text-gray-700 mb-6 text-lg">{error}</p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800 font-semibold mb-2">Common Solutions:</p>
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Run <code className="bg-yellow-100 px-1">schema-complete.sql</code> in Supabase SQL Editor</li>
              <li>Set your role to 'admin': <code className="bg-yellow-100 px-1">UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';</code></li>
              <li>Make sure you're logged in</li>
              <li>Check browser console (F12) for more details</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary-600 text-white px-4 py-3 rounded hover:bg-primary-700 font-medium"
            >
              Retry
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded hover:bg-gray-300 font-medium"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded hover:bg-gray-200 font-medium"
            >
              Go to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                {profile?.role === 'admin' ? 'Administrator' : 'Proctor'} Portal
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin/sessions')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                All Sessions
              </button>
              <button
                onClick={() => router.push('/admin/answers')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Grade Answers
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Settings
              </button>
              <button
                onClick={async () => {
                  const { signOut } = await import('@/lib/supabase/auth');
                  await signOut();
                  router.push('/login');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSessions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Flagged Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.flaggedSessions}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Integrity</p>
                <p className="text-3xl font-bold text-gray-900">{(stats.avgIntegrity * 100).toFixed(0)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          <div className="overflow-x-auto">
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
                {sessions.map(session => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{session.student_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{session.student_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.exam_title || 'Unknown Exam'}
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
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          session.integrity_score >= 0.7 ? 'text-green-600' :
                          session.integrity_score >= 0.5 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {(session.integrity_score * 100).toFixed(0)}%
                        </span>
                      </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/admin/session/${session.id}`)}
                        className="text-primary-600 hover:text-primary-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/admin/exams')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Manage Exams</h3>
            <p className="text-sm text-gray-600">View exams and manage questions</p>
          </button>

          <button
            onClick={() => router.push('/admin/sessions?status=in_progress')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Monitor Live Sessions</h3>
            <p className="text-sm text-gray-600">View and monitor currently active exam sessions</p>
          </button>

          <button
            onClick={() => router.push('/admin/sessions?flagged=true')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Review Flagged Sessions</h3>
            <p className="text-sm text-gray-600">Investigate sessions with low integrity scores</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <button
            onClick={() => router.push('/admin/answers')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Grade Answers</h3>
            <p className="text-sm text-gray-600">Review and grade student exam answers</p>
          </button>

          <button
            onClick={() => router.push('/admin/audit')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Audit Logs</h3>
            <p className="text-sm text-gray-600">View system activity and admin actions</p>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Configure system settings and preferences</p>
          </button>
        </div>
      </main>
    </div>
  );
}
