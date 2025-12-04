'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { Profile } from '@/types';

interface Question {
  id: string;
  question_number: number;
  question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  question_text: string;
  options?: string[];
  points: number;
}

export default function AdminQuestionsPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionType, setQuestionType] = useState<Question['question_type']>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [points, setPoints] = useState(5);

  useEffect(() => {
    loadExamAndQuestions();
  }, [params.examId]);

  async function loadExamAndQuestions() {
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

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', params.examId)
        .single();

      if (examError) {
        setError(`Failed to load exam: ${examError.message}`);
        setLoading(false);
        return;
      }
      
      setExam(examData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', params.examId)
        .order('question_number');

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        // Don't fail completely if questions don't load
      }
      
      setQuestions(questionsData || []);
      
      // Set next question number
      if (questionsData && questionsData.length > 0) {
        setQuestionNumber(questionsData[questionsData.length - 1].question_number + 1);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load exam questions');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    try {
      const questionData: any = {
        exam_id: params.examId,
        question_number: questionNumber,
        question_type: questionType,
        question_text: questionText,
        points: points,
      };

      if (questionType === 'multiple_choice' || questionType === 'true_false') {
        questionData.options = questionType === 'true_false' ? ['True', 'False'] : options.filter(o => o.trim());
        questionData.correct_answer = correctAnswer;
      } else if (questionType === 'short_answer') {
        questionData.correct_answer = correctAnswer || null;
      }

      const { error } = await supabase.from('questions').insert([questionData]);

      if (error) throw error;

      // Reset form
      setQuestionNumber(questionNumber + 1);
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer('');
      setPoints(5);

      // Reload questions
      await loadExamAndQuestions();
      alert('Question added successfully!');
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) throw error;
      await loadExamAndQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
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

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-yellow-600 text-xl font-semibold mb-4">Exam Not Found</div>
          <p className="text-gray-700 mb-6">The exam with ID &quot;{params.examId}&quot; does not exist.</p>
          <button
            onClick={() => router.push('/admin')}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Go to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back to Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Manage Questions</h1>
          <p className="text-gray-600 mt-2">Exam: {exam?.title}</p>
        </div>

        {/* Existing Questions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Existing Questions ({questions.length})</h2>
          {questions.length === 0 ? (
            <p className="text-gray-500">No questions yet. Add your first question below.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">Q{q.question_number}.</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {q.question_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-600">{q.points} points</span>
                      </div>
                      <p className="text-gray-900 mb-2">{q.question_text}</p>
                      {q.options && (
                        <div className="ml-4 space-y-1">
                          {q.options.map((opt, idx) => (
                            <div key={idx} className="text-sm text-gray-700">• {opt}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Question Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Number
                </label>
                <input
                  type="number"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                required
              />
            </div>

            {questionType === 'multiple_choice' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  {options.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        setOptions(newOpts);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                      required
                    />
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    placeholder="Enter exact answer for auto-grading"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </>
            )}

            {questionType === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer
                </label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select...</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
            )}

            {questionType === 'short_answer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer (optional, for auto-grading)
                </label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Leave blank for manual grading"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={adding}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Question'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
