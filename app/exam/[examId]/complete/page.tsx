'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { ExamSession, Exam } from '@/types';

export default function ExamCompletePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<ExamSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    loadSessionResults();
  }, [sessionId]);

  async function loadSessionResults() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (!sessionId) {
        router.push('/dashboard');
        return;
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('student_id', user.id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Count alerts
      const { count } = await supabase
        .from('suspicious_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      setAlertCount(count || 0);
    } catch (error) {
      console.error('Failed to load session results:', error);
      alert('Failed to load results. Please try again.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  function getIntegrityStatus(score: number): { label: string; color: string; icon: string } {
    if (score >= 0.9) {
      return {
        label: 'Excellent',
        color: 'text-green-600 bg-green-50',
        icon: '✓',
      };
    } else if (score >= 0.7) {
      return {
        label: 'Good',
        color: 'text-blue-600 bg-blue-50',
        icon: '✓',
      };
    } else if (score >= 0.5) {
      return {
        label: 'Fair',
        color: 'text-yellow-600 bg-yellow-50',
        icon: '!',
      };
    } else {
      return {
        label: 'Needs Review',
        color: 'text-red-600 bg-red-50',
        icon: '⚠',
      };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!session || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Session not found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-primary-600 hover:text-primary-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const integrityStatus = getIntegrityStatus(session.integrity_score);
  const duration = session.ended_at && session.started_at
    ? Math.floor((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Submitted Successfully</h1>
          <p className="text-gray-600">{exam.title}</p>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Summary</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Session ID</p>
              <p className="font-mono text-sm text-gray-900">{session.id.slice(0, 13)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="font-medium text-gray-900">{duration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Started</p>
              <p className="font-medium text-gray-900">
                {new Date(session.started_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="font-medium text-gray-900">
                {session.ended_at ? new Date(session.ended_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Integrity Score */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Integrity Assessment</h2>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Integrity Score</p>
              <div className="flex items-center space-x-3">
                <div className="text-4xl font-bold text-gray-900">
                  {(session.integrity_score * 100).toFixed(0)}%
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${integrityStatus.color}`}>
                  {integrityStatus.icon} {integrityStatus.label}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Flagged Events</p>
              <div className={`text-3xl font-bold ${alertCount > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                {alertCount}
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                session.integrity_score >= 0.7 ? 'bg-green-500' :
                session.integrity_score >= 0.5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${session.integrity_score * 100}%` }}
            ></div>
          </div>

          {session.integrity_score < 0.7 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your exam session has been flagged for review. 
                This may be due to environmental factors or technical issues. A proctor 
                will review your session and contact you if any action is needed.
              </p>
            </div>
          )}
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Automated Review</p>
                <p className="text-sm text-gray-600">
                  Our AI system analyzes your session for any integrity concerns.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Proctor Review (if needed)</p>
                <p className="text-sm text-gray-600">
                  If alerts were triggered, a human proctor will review your session.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Final Results</p>
                <p className="text-sm text-gray-600">
                  Your instructor will receive the final exam results and integrity report.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        {alertCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Have concerns about flagged events?</h3>
            <p className="text-sm text-blue-800 mb-3">
              If you believe alerts were triggered incorrectly due to technical issues or 
              environmental factors, you can submit an appeal or contact support.
            </p>
            <button
              onClick={() => router.push('/support')}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Contact Support →
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}
