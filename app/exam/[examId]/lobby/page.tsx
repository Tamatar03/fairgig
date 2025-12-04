'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { Exam } from '@/types';

interface CheckStatus {
  camera: 'pending' | 'success' | 'error';
  network: 'pending' | 'success' | 'error';
  fullscreen: 'pending' | 'success' | 'error';
  consent: boolean;
}

export default function ExamLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [checks, setChecks] = useState<CheckStatus>({
    camera: 'pending',
    network: 'pending',
    fullscreen: 'pending',
    consent: false,
  });
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);

  useEffect(() => {
    loadExam();
    runPreflightChecks();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [examId]);

  async function loadExam() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (error) throw error;
      setExam(data);
    } catch (error) {
      console.error('Failed to load exam:', error);
      alert('Failed to load exam. Please try again.');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function runPreflightChecks() {
    // Check camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      setCameraStream(stream);
      setChecks(prev => ({ ...prev, camera: 'success' }));
    } catch (err) {
      console.error('Camera error:', err);
      setChecks(prev => ({ ...prev, camera: 'error' }));
    }

    // Check network latency
    try {
      const start = Date.now();
      await fetch('/api/health');
      const latency = Date.now() - start;
      setNetworkLatency(latency);
      setChecks(prev => ({ 
        ...prev, 
        network: latency < 1000 ? 'success' : 'error' 
      }));
    } catch (err) {
      console.error('Network error:', err);
      setChecks(prev => ({ ...prev, network: 'error' }));
    }

    // Check fullscreen capability
    if (document.fullscreenEnabled) {
      setChecks(prev => ({ ...prev, fullscreen: 'success' }));
    } else {
      setChecks(prev => ({ ...prev, fullscreen: 'error' }));
    }
  }

  async function startExam() {
    if (!exam) return;

    if (checks.camera !== 'success' || checks.network !== 'success' || !checks.consent) {
      alert('Please complete all pre-exam checks before starting.');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Create exam session
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .insert({
          exam_id: exam.id,
          student_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          device_info: {
            browser: navigator.userAgent,
            screen: {
              width: window.screen.width,
              height: window.screen.height,
            },
            networkLatency: networkLatency,
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Enter fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }

      // Navigate to exam
      router.push(`/exam/${examId}?sessionId=${session.id}`);
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('Failed to start exam. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Exam not found.</p>
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

  const allChecksPassed = checks.camera === 'success' && 
                          checks.network === 'success' && 
                          checks.consent;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
          <p className="text-gray-600">Pre-Exam Checks</p>
        </div>

        {/* Pre-flight Checks */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Requirements</h2>
          
          <div className="space-y-4">
            {/* Camera Check */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {checks.camera === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : checks.camera === 'error' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                )}
                <div>
                  <p className="font-medium text-gray-900">Camera Access</p>
                  <p className="text-sm text-gray-600">Webcam is required for proctoring</p>
                </div>
              </div>
              {cameraStream && (
                <video
                  ref={(el) => {
                    if (el && cameraStream) el.srcObject = cameraStream;
                  }}
                  autoPlay
                  muted
                  className="w-32 h-24 rounded-lg object-cover"
                />
              )}
            </div>

            {/* Network Check */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {checks.network === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : checks.network === 'error' ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                )}
                <div>
                  <p className="font-medium text-gray-900">Network Connection</p>
                  <p className="text-sm text-gray-600">
                    {networkLatency !== null 
                      ? `Latency: ${networkLatency}ms ${networkLatency < 1000 ? '(Good)' : '(Poor)'}`
                      : 'Testing connection...'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Fullscreen Check */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {checks.fullscreen === 'success' ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <div>
                  <p className="font-medium text-gray-900">Fullscreen Mode</p>
                  <p className="text-sm text-gray-600">Exam will run in fullscreen mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consent & Agreement</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-4">
                By starting this exam, you agree to:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                <li>Continuous video monitoring via webcam</li>
                <li>AI-powered behavior analysis</li>
                <li>Screen recording and activity tracking</li>
                <li>Storage of exam session data for academic integrity purposes</li>
                <li>Review by proctors if suspicious activity is detected</li>
              </ul>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checks.consent}
                onChange={(e) => setChecks(prev => ({ ...prev, consent: e.target.checked }))}
                className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the monitoring and data collection practices described above. 
                I understand that this exam is being proctored and monitored for academic integrity.
              </span>
            </label>
          </div>
        </div>

        {/* Exam Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium text-gray-900">{exam.duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-gray-600">Monitoring</p>
              <p className="font-medium text-gray-900">AI + Human Proctoring</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={startExam}
            disabled={!allChecksPassed}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              allChecksPassed
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Start Exam
          </button>
        </div>

        {!allChecksPassed && (
          <p className="text-center text-sm text-red-600 mt-4">
            Please complete all checks and consent before starting the exam.
          </p>
        )}
      </div>
    </div>
  );
}
