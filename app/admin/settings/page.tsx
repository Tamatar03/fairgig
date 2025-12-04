'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    focusThreshold: 0.7,
    phoneAlertLevel: 'high' as 'high' | 'medium' | 'low',
    gazeAlertLevel: 'medium' as 'high' | 'medium' | 'low',
    autoFlagThreshold: 0.5,
    retentionDays: 90,
    mlServiceUrl: process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const profile = await getUserProfile(user.id);
      if (!profile || profile.role !== 'admin') {
        alert('Access denied. Admin role required.');
        router.push('/admin');
        return;
      }
    } catch (error) {
      console.error('Access check failed:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // In a real app, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Detection Thresholds */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection Thresholds</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Score Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.focusThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, focusThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0 (Strict)</span>
                  <span className="font-medium">{(settings.focusThreshold * 100).toFixed(0)}%</span>
                  <span>100 (Lenient)</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Sessions with focus score below this threshold will be flagged for review.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Detection Alert Level
                </label>
                <select
                  value={settings.phoneAlertLevel}
                  onChange={(e) => setSettings(prev => ({ ...prev, phoneAlertLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gaze Detection Alert Level
                </label>
                <select
                  value={settings.gazeAlertLevel}
                  onChange={(e) => setSettings(prev => ({ ...prev, gazeAlertLevel: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Flag Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.autoFlagThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoFlagThreshold: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span className="font-medium">{(settings.autoFlagThreshold * 100).toFixed(0)}%</span>
                  <span>100</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Automatically flag sessions with integrity score below this threshold.
                </p>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Period (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Snapshots and video data will be automatically deleted after this period.
                </p>
              </div>
            </div>
          </div>

          {/* ML Service Configuration */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ML Service Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ML Service URL
                </label>
                <input
                  type="url"
                  value={settings.mlServiceUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, mlServiceUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="http://localhost:8000"
                />
                <p className="text-sm text-gray-500 mt-2">
                  URL of the ML inference service endpoint.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 flex justify-end space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white rounded-lg shadow border-2 border-red-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Clear Old Sessions</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete sessions older than retention period
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                  Run Cleanup
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
