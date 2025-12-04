'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { getSignedUrl } from '@/lib/supabase/storage';
import { ExamSession, Exam, Profile, CheatScore, SuspiciousSnapshot } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminSessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<ExamSession | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [scores, setScores] = useState<CheatScore[]>([]);
  const [snapshots, setSnapshots] = useState<SuspiciousSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  async function loadSessionDetails() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getUserProfile(user.id);
      if (!profile || !['admin', 'proctor', 'support'].includes(profile.role)) {
        router.push('/dashboard');
        return;
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', sessionData.exam_id)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Load student
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.student_id)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Load cheat scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('cheat_scores')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (scoresError) throw scoresError;
      setScores(scoresData || []);

      // Load snapshots
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('suspicious_snapshots')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (snapshotsError) throw snapshotsError;
      setSnapshots(snapshotsData || []);
    } catch (error) {
      console.error('Failed to load session details:', error);
      alert('Failed to load session details.');
      router.push('/admin/sessions');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;

    try {
      const user = await getCurrentUser();
      if (!user) return;

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'add_note',
        resource_type: 'exam_session',
        resource_id: sessionId,
        details: { note: noteText },
      });

      alert('Note added successfully');
      setNoteText('');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note.');
    }
  }

  async function handleMarkFalsePositive(snapshotId: string) {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      await supabase
        .from('suspicious_snapshots')
        .update({
          admin_review_status: 'false_positive',
          notes: 'Marked as false positive by admin',
        })
        .eq('id', snapshotId);

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'mark_false_positive',
        resource_type: 'suspicious_snapshot',
        resource_id: snapshotId,
        details: { session_id: sessionId },
      });

      loadSessionDetails();
      alert('Snapshot marked as false positive');
    } catch (error) {
      console.error('Failed to mark false positive:', error);
      alert('Failed to update snapshot.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session || !exam || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Session not found</p>
      </div>
    );
  }

  const chartData = scores.map(score => ({
    time: new Date(score.timestamp).toLocaleTimeString(),
    focusScore: score.focus_score * 100,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
              <p className="text-sm text-gray-600 mt-1">ID: {session.id}</p>
            </div>
            <button
              onClick={() => router.push('/admin/sessions')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Sessions
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Student</h3>
            <p className="text-lg font-semibold text-gray-900">{student.display_name}</p>
            <p className="text-sm text-gray-600">{student.email}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Exam</h3>
            <p className="text-lg font-semibold text-gray-900">{exam.title}</p>
            <p className="text-sm text-gray-600">{exam.duration_minutes} minutes</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Integrity Score</h3>
            <p className={`text-3xl font-bold ${
              session.integrity_score >= 0.7 ? 'text-green-600' :
              session.integrity_score >= 0.5 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {(session.integrity_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Focus Score Timeline */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Focus Score Over Time</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="focusScore" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 text-center py-12">No score data available</p>
          )}
        </div>

        {/* Suspicious Snapshots */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Suspicious Snapshots ({snapshots.length})
          </h2>
          {snapshots.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No suspicious activity detected</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshots.map(snapshot => (
                <div key={snapshot.id} className="border rounded-lg p-4">
                  <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                    <img
                      src={`/api/placeholder/400/300`}
                      alt="Snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        snapshot.severity === 'high' ? 'bg-red-100 text-red-800' :
                        snapshot.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {snapshot.event_code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(snapshot.ml_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </p>
                    {snapshot.admin_review_status === 'false_positive' ? (
                      <span className="text-xs text-green-600 font-medium">✓ False Positive</span>
                    ) : (
                      <button
                        onClick={() => handleMarkFalsePositive(snapshot.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark as False Positive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Note */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Admin Note</h2>
          <div className="space-y-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter notes about this session..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
