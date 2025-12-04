'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Exam, ExamSession, Alert as AlertType, AlertCode, AlertSeverity } from '@/types';
import VideoCaptureManager from '@/components/exam/VideoCaptureManager';
import FrameSender from '@/components/exam/FrameSender';
import LiveGauge from '@/components/exam/LiveGauge';
import AlertList from '@/components/exam/AlertList';

interface Question {
  id: string;
  question_number: number;
  question_type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  question_text: string;
  options?: string[];
  points: number;
}

interface Answer {
  question_id: string;
  answer_text: string;
  time_spent_seconds?: number;
}

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const sessionId = searchParams.get('sessionId');

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showWebcam, setShowWebcam] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [focusScore, setFocusScore] = useState<number>(1.0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'degraded' | 'offline'>('connected');
  const [sequenceNumber, setSequenceNumber] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadExamAndSession();
    enforceFullscreen();
    preventTabSwitch();
    startWebcam();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      exitFullscreen();
      stopWebcam();
    };
  }, [examId, sessionId]);

  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start webcam:', error);
    }
  }

  function stopWebcam() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }

  async function loadExamAndSession() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_number');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Load or verify session
      if (sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('student_id', user.id)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData);

        // Load existing answers
        const { data: answersData } = await supabase
          .from('student_answers')
          .select('*')
          .eq('session_id', sessionId);

        if (answersData) {
          const answersMap: Record<string, string> = {};
          answersData.forEach((a: any) => {
            answersMap[a.question_id] = a.answer_text;
          });
          setAnswers(answersMap);
        }

        // Calculate time remaining
        const startTime = new Date(sessionData.started_at).getTime();
        const durationMs = examData.duration_minutes * 60 * 1000;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, durationMs - elapsed);
        setTimeRemaining(Math.floor(remaining / 1000));

        // Start timer
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              endExam();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }

      // Subscribe to real-time alerts
      const channel = supabase
        .channel(`exam-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cheat_scores',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const score = payload.new;
            setFocusScore(score.focus_score);
            if (score.alerts && score.alerts.length > 0) {
              const newAlerts: AlertType[] = score.alerts.map((a: any) => ({
                id: crypto.randomUUID(),
                code: a.code,
                severity: a.severity,
                description: a.description,
                timestamp: new Date(score.timestamp),
                confidence: a.confidence,
              }));
              setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to load exam:', error);
      alert('Failed to load exam. Please try again.');
      router.push('/dashboard');
    }
  }

  function enforceFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        alert('Please stay in fullscreen mode during the exam.');
        document.documentElement.requestFullscreen().catch(console.warn);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }

  function preventTabSwitch() {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addAlert({
          id: crypto.randomUUID(),
          code: AlertCode.TAB_SWITCH,
          severity: AlertSeverity.MEDIUM,
          description: 'Student switched tabs or minimized window',
          timestamp: new Date(),
          confidence: 1.0,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }

  function addAlert(alert: AlertType) {
    setAlerts(prev => [alert, ...prev].slice(0, 20));
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn);
    }
  }

  async function endExam() {
    if (!session) return;

    try {
      setIsCapturing(false);

      // Update session status
      await supabase
        .from('exam_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      exitFullscreen();
      router.push(`/exam/${examId}/complete?sessionId=${session.id}`);
    } catch (error) {
      console.error('Failed to end exam:', error);
      alert('Failed to submit exam. Please contact support.');
    }
  }

  function handleFrameReady(frame: string) {
    // Frame will be sent by FrameSender component
    setSequenceNumber(prev => prev + 1);
  }

  function handleFrameResponse(response: any) {
    if (response.ml) {
      setFocusScore(response.ml.focus_score);

  async function handleAnswerChange(questionId: string, answerText: string) {
    if (!session) return;

    // Update local state
    setAnswers(prev => ({ ...prev, [questionId]: answerText }));

    // Save to database
    try {
      const { error } = await supabase
        .from('student_answers')
        .upsert({
          session_id: session.id,
          question_id: questionId,
          student_id: session.student_id,
          answer_text: answerText,
          answered_at: new Date().toISOString(),
        }, {
          onConflict: 'session_id,question_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  }

  const currentQuestion = questions[currentQuestionIndex];
      if (response.ml.alerts && response.ml.alerts.length > 0) {
        const newAlerts: AlertType[] = response.ml.alerts.map((a: any) => ({
          id: crypto.randomUUID(),
          code: a.code,
          severity: a.severity,
          description: a.description,
          timestamp: new Date(),
          confidence: a.confidence,
        }));
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
      }
    }
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if (!exam || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hidden components for background processing */}
      <div className="hidden">
        <VideoCaptureManager
          config={{
            frameIntervalMs: 500,
            frameWidth: 640,
            frameHeight: 480,
            jpegQuality: 0.8,
          }}
          onFrameReady={handleFrameReady}
          onPermissionDenied={() => alert('Camera access is required')}
          onCameraLost={() => setConnectionStatus('offline')}
          isActive={isCapturing}
        />
        {session && (
          <FrameSender
            sessionId={session.id}
            studentId={session.student_id}
            onResponse={handleFrameResponse}
            onError={(error) => {
              console.error('Frame send error:', error);
              setConnectionStatus('degraded');
            }}
            isActive={isCapturing}
          />
        )}
      </div>

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">{exam.title}</h1>
            <p className="text-sm text-gray-400">Session ID: {session.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className={`flex items-center space-x-2 ${
              connectionStatus === 'connected' ? 'text-green-400' :
              connectionStatus === 'degraded' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
              <span className="text-sm capitalize">{connectionStatus}</span>
            </div>
            <div className={`text-2xl font-mono ${timeRemaining < 300 ? 'text-red-400' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={endExam}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              End Exam
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Alerts */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Monitoring Alerts</h2>
          <AlertList
            alerts={alerts}
            onDismiss={(index) => setAlerts(prev => prev.filter((_, i) => i !== index))}
          />
        </aside>

        {/* Main Exam Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Webcam Preview */}
            {showWebcam && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Your Webcam</h3>
                  <button
                    onClick={() => setShowWebcam(!showWebcam)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {showWebcam ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover mirror"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded text-xs font-medium">
                    ● RECORDING
                  </div>
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Questions</h2>
                <div className="text-sm text-gray-400">
                  {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No questions available for this exam.</p>
                  <p className="text-sm mt-2">Please contact your administrator.</p>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-6">
                  {/* Current Question */}
                  <div className="p-6 bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-semibold">Question {currentQuestion.question_number}</span>
                          <span className="text-sm bg-blue-600 px-2 py-1 rounded">
                            {currentQuestion.question_type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-400">{currentQuestion.points} points</span>
                        </div>
                        <p className="text-lg text-gray-100">{currentQuestion.question_text}</p>
                      </div>
                    </div>

                    {/* Answer Input */}
                    <div className="mt-6">
                      {currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false' ? (
                        <div className="space-y-3">
                          {currentQuestion.options?.map((option, idx) => (
                            <label
                              key={idx}
                              className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                                answers[currentQuestion.id] === option
                                  ? 'bg-primary-600 border-2 border-primary-400'
                                  : 'bg-gray-600 border-2 border-transparent hover:border-gray-500'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option}
                                checked={answers[currentQuestion.id] === option}
                                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                className="mr-3"
                              />
                              <span className="flex-1">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : currentQuestion.question_type === 'short_answer' ? (
                        <input
                          type="text"
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="w-full p-4 bg-gray-600 rounded-lg border-2 border-gray-500 focus:border-primary-500 text-white"
                          placeholder="Type your answer..."
                        />
                      ) : (
                        <textarea
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="w-full p-4 bg-gray-600 rounded-lg border-2 border-gray-500 focus:border-primary-500 text-white"
                          rows={8}
                          placeholder="Type your essay answer..."
                        />
                      )}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex gap-2">
                      {questions.map((q, idx) => (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-10 h-10 rounded-lg font-medium ${
                            idx === currentQuestionIndex
                              ? 'bg-primary-600'
                              : answers[q.id]
                              ? 'bg-green-600'
                              : 'bg-gray-700'
                          }`}
                        >
                          {q.question_number}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Live Gauge */}
        <aside className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-4">Focus Score</h2>
          <LiveGauge currentScore={focusScore} scores={[]} />
          
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-medium mb-2">Integrity Guidelines</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Look at your screen
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                Stay in fullscreen
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">✗</span>
                Don't use phone
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">✗</span>
                Don't talk to others
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">✗</span>
                Don't switch tabs
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
