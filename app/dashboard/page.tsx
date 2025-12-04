'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Exam, ExamSession, Profile } from '@/types';

interface ExamWithSession extends Exam {
  latestSession?: ExamSession | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<ExamWithSession[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const userProfile = await getUserProfile(user.id);
      if (!userProfile) {
        router.push('/login');
        return;
      }

      setProfile(userProfile);

      // Load available exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (examsError) throw examsError;

      // Load user's sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);

      // Combine exams with latest sessions
      const examsWithSessions: ExamWithSession[] = (examsData || []).map(exam => {
        const latestSession = (sessionsData || []).find(s => s.exam_id === exam.id);
        return { ...exam, latestSession };
      });

      setExams(examsWithSessions);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  function getExamStatus(exam: ExamWithSession): { label: string; color: string } {
    if (!exam.latestSession) {
      return { label: 'Ready', color: 'bg-blue-100 text-blue-800' };
    }

    switch (exam.latestSession.status) {
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' };
      case 'completed':
        return { label: 'Completed', color: 'bg-green-100 text-green-800' };
      case 'aborted':
        return { label: 'Aborted', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Ready', color: 'bg-blue-100 text-blue-800' };
    }
  }

  function handleExamClick(exam: ExamWithSession) {
    if (exam.latestSession?.status === 'in_progress') {
      router.push(`/exam/${exam.id}`);
    } else {
      router.push(`/exam/${exam.id}/lobby`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {profile?.display_name || profile?.email}
              </p>
            </div>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Available Exams */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No exams available at this time.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {exams.map(exam => {
                const status = getExamStatus(exam);
                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleExamClick(exam)}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {exam.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {exam.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {exam.duration_minutes} min
                        </span>
                        {exam.latestSession && (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Score: {(exam.latestSession.integrity_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      <button
                        className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExamClick(exam);
                        }}
                      >
                        {exam.latestSession?.status === 'in_progress' ? 'Continue Exam' : 'Start Exam'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Sessions */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">No exam sessions yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Integrity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map(session => {
                    const exam = exams.find(e => e.id === session.exam_id);
                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exam?.title || 'Unknown Exam'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.started_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'completed' ? 'bg-green-100 text-green-800' :
                            session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(session.integrity_score * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {session.status === 'in_progress' ? (
                            <button
                              onClick={() => router.push(`/exam/${session.exam_id}`)}
                              className="text-primary-600 hover:text-primary-900 font-medium"
                            >
                              Continue
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/exam/${session.exam_id}/complete?sessionId=${session.id}`)}
                              className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                              View Results
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
