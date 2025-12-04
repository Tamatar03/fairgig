'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { Profile } from '@/types';

interface Exam {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  question_count?: number;
}

export default function AdminExamsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadExams();
  }, []);

  async function checkAuthAndLoadExams() {
    try {
      setError(null);
      
      // Check authentication
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check admin role
      const userProfile = await getUserProfile(user.id);
      if (!userProfile || !['admin', 'proctor'].includes(userProfile.role)) {
        setError('Access denied. Admin or proctor role required.');
        setLoading(false);
        return;
      }
      
      setProfile(userProfile);

      // Load exams with question counts
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (examsError) {
        setError(`Failed to load exams: ${examsError.message}`);
        setLoading(false);
        return;
      }

      // Get question counts for each exam
      const examsWithCounts = await Promise.all(
        (examsData || []).map(async (exam) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);
          
          return { ...exam, question_count: count || 0 };
        })
      );

      setExams(examsWithCounts);
    } catch (error: any) {
      console.error('Error loading exams:', error);
      setError(error.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }

  async function toggleExamStatus(examId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ is_active: !currentStatus })
        .eq('id', examId);

      if (error) throw error;
      
      // Refresh exams list
      await checkAuthAndLoadExams();
    } catch (error) {
      console.error('Error toggling exam status:', error);
      alert('Failed to update exam status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading exams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin')}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Go to Admin Dashboard
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Manage Exams</h1>
          <p className="text-gray-600 mt-2">View and manage exam questions</p>
        </div>

        {exams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 mb-4">No exams available yet.</p>
            <p className="text-sm text-gray-400">Create an exam in Supabase to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    exam.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{exam.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {exam.duration_minutes} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Passing: {exam.passing_score}%
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {exam.question_count} questions
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => router.push(`/admin/exam/${exam.id}/questions`)}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-sm font-medium"
                  >
                    Manage Questions
                  </button>
                  <button
                    onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                    className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
                  >
                    {exam.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(exam.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
