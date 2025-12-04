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

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  const sessionId = searchParams.get('sessionId');

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [focusScore, setFocusScore] = useState<number>(1.0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'degraded' | 'offline'>('connected');
  const [sequenceNumber, setSequenceNumber] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadExamAndSession();
    enforceFullscreen();
    preventTabSwitch();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      exitFullscreen();
    };
  }, [examId, sessionId]);

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
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Exam Questions</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300">
                  This is a placeholder for exam questions. In a real implementation, 
                  questions would be loaded from the database and rendered here with 
                  answer inputs (multiple choice, text entry, etc.).
                </p>
                <div className="mt-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className="p-4 bg-gray-700 rounded-lg">
                      <p className="font-medium mb-2">Question {num}</p>
                      <textarea
                        className="w-full p-3 bg-gray-600 rounded border border-gray-500 text-white"
                        rows={3}
                        placeholder="Type your answer here..."
                      />
                    </div>
                  ))}
                </div>
              </div>
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
