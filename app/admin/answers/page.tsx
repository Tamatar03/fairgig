'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { Profile } from '@/types';

interface StudentAnswer {
  id: string;
  session_id: string;
  question_id: string;
  student_id: string;
  answer_text: string;
  answered_at: string;
  is_flagged: boolean;
  admin_score: number | null;
  admin_feedback: string | null;
  student: {
    email: string;
    display_name: string;
  };
  question: {
    question_number: number;
    question_text: string;
    question_type: string;
    correct_answer: string | null;
    points: number;
  };
  exam_session: {
    exam_id: string;
    exam: {
      title: string;
    };
  };
}

export default function AdminAnswersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'ungraded'>('all');
  const [selectedAnswer, setSelectedAnswer] = useState<StudentAnswer | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      loadAnswers();
    }
  }, [filter, profile]);

  async function checkAuth() {
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
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
      setLoading(false);
    }
  }

  async function loadAnswers() {
    try {
      let query = supabase
        .from('student_answers')
        .select(`
          *,
          student:profiles!student_id(email, display_name),
          question:questions!question_id(question_number, question_text, question_type, correct_answer, points),
          exam_session:exam_sessions!session_id(
            exam_id,
            exam:exams!exam_id(title)
          )
        `)
        .order('answered_at', { ascending: false });

      if (filter === 'flagged') {
        query = query.eq('is_flagged', true);
      } else if (filter === 'ungraded') {
        query = query.is('admin_score', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading answers:', error);
        // Don't fail completely, just show empty list
      }
      
      setAnswers(data || []);
    } catch (error: any) {
      console.error('Error loading answers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrade(answerId: string) {
    try {
      const { error } = await supabase
        .from('student_answers')
        .update({
          admin_score: score ? parseInt(score) : null,
          admin_feedback: feedback || null,
        })
        .eq('id', answerId);

      if (error) throw error;

      alert('Answer graded successfully!');
      setSelectedAnswer(null);
      setScore('');
      setFeedback('');
      await loadAnswers();
    } catch (error) {
      console.error('Error grading answer:', error);
      alert('Failed to grade answer');
    }
  }

  async function handleFlag(answerId: string, flagged: boolean) {
    try {
      const { error } = await supabase
        .from('student_answers')
        .update({ is_flagged: flagged })
        .eq('id', answerId);

      if (error) throw error;
      await loadAnswers();
    } catch (error) {
      console.error('Error flagging answer:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading answers...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Student Answers</h1>
          <p className="text-gray-600 mt-2">Review and grade student exam answers</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All Answers ({answers.length})
            </button>
            <button
              onClick={() => setFilter('ungraded')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'ungraded' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Ungraded
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'flagged' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Flagged
            </button>
          </div>
        </div>

        {/* Answers List */}
        <div className="space-y-4">
          {answers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
              No answers found for selected filter
            </div>
          ) : (
            answers.map((answer) => (
              <div key={answer.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {answer.exam_session.exam.title} - Q{answer.question.question_number}
                      </h3>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {answer.question.question_type.replace('_', ' ')}
                      </span>
                      {answer.is_flagged && (
                        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          🚩 Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Student: {answer.student.display_name || answer.student.email} • 
                      Answered: {new Date(answer.answered_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFlag(answer.id, !answer.is_flagged)}
                      className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      {answer.is_flagged ? 'Unflag' : 'Flag'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAnswer(answer);
                        setScore(answer.admin_score?.toString() || '');
                        setFeedback(answer.admin_feedback || '');
                      }}
                      className="text-sm px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
                    >
                      Grade
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
                    <p className="text-gray-900">{answer.question.question_text}</p>
                    <p className="text-sm text-gray-500 mt-1">Points: {answer.question.points}</p>
                    {answer.question.correct_answer && (
                      <p className="text-sm text-green-700 mt-1">
                        Correct Answer: {answer.question.correct_answer}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Student Answer:</p>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{answer.answer_text}</p>
                    </div>
                  </div>

                  {(answer.admin_score !== null || answer.admin_feedback) && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      {answer.admin_score !== null && (
                        <p className="text-sm">
                          <span className="font-medium">Score:</span> {answer.admin_score}/{answer.question.points}
                        </p>
                      )}
                      {answer.admin_feedback && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Feedback:</span> {answer.admin_feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Grading Modal */}
        {selectedAnswer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Grade Answer</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Question:</p>
                  <p className="text-gray-900">{selectedAnswer.question.question_text}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Student Answer:</p>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="whitespace-pre-wrap">{selectedAnswer.answer_text}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score (out of {selectedAnswer.question.points})
                  </label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    min="0"
                    max={selectedAnswer.question.points}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Provide feedback to the student..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleGrade(selectedAnswer.id)}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                >
                  Save Grade
                </button>
                <button
                  onClick={() => {
                    setSelectedAnswer(null);
                    setScore('');
                    setFeedback('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
