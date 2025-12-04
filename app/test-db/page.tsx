'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getUserProfile } from '@/lib/supabase/auth';

export default function TestDBPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  async function runTests() {
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Environment variables
    testResults.tests.push({
      name: '1. Environment Variables',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PASS' : 'FAIL',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
      }
    });

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      testResults.tests.push({
        name: '2. Supabase Connection',
        status: !error ? 'PASS' : 'FAIL',
        details: error ? error.message : 'Connection successful'
      });
    } catch (e: any) {
      testResults.tests.push({
        name: '2. Supabase Connection',
        status: 'FAIL',
        details: e.message
      });
    }

    // Test 3: Authentication
    try {
      const user = await getCurrentUser();
      testResults.tests.push({
        name: '3. Current User',
        status: user ? 'PASS' : 'FAIL',
        details: user ? { id: user.id, email: user.email } : 'Not logged in'
      });

      // Test 4: User Profile
      if (user) {
        const profile = await getUserProfile(user.id);
        testResults.tests.push({
          name: '4. User Profile',
          status: profile ? 'PASS' : 'FAIL',
          details: profile || 'Profile not found'
        });
      }
    } catch (e: any) {
      testResults.tests.push({
        name: '3. Authentication',
        status: 'FAIL',
        details: e.message
      });
    }

    // Test 5: Tables Exist
    const tables = ['profiles', 'exams', 'exam_sessions', 'questions', 'student_answers'];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        testResults.tests.push({
          name: `5. Table: ${table}`,
          status: !error ? 'PASS' : 'FAIL',
          details: error ? error.message : 'Table exists'
        });
      } catch (e: any) {
        testResults.tests.push({
          name: `5. Table: ${table}`,
          status: 'FAIL',
          details: e.message
        });
      }
    }

    // Test 6: Sample Data
    try {
      const { data, error } = await supabase.from('exams').select('*');
      testResults.tests.push({
        name: '6. Sample Exams',
        status: !error ? 'PASS' : 'FAIL',
        details: error ? error.message : `Found ${data?.length || 0} exams`
      });
    } catch (e: any) {
      testResults.tests.push({
        name: '6. Sample Exams',
        status: 'FAIL',
        details: e.message
      });
    }

    setResults(testResults);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Running Database Tests...</h1>
          <div className="animate-pulse">Testing connection...</div>
        </div>
      </div>
    );
  }

  const passCount = results.tests.filter((t: any) => t.status === 'PASS').length;
  const failCount = results.tests.filter((t: any) => t.status === 'FAIL').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
        <p className="text-gray-400 mb-8">{results.timestamp}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-green-900 p-4 rounded">
            <div className="text-2xl font-bold">{passCount}</div>
            <div className="text-sm">Tests Passed</div>
          </div>
          <div className="bg-red-900 p-4 rounded">
            <div className="text-2xl font-bold">{failCount}</div>
            <div className="text-sm">Tests Failed</div>
          </div>
        </div>

        <div className="space-y-4">
          {results.tests.map((test: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded border-l-4 ${
                test.status === 'PASS'
                  ? 'bg-green-900 bg-opacity-20 border-green-500'
                  : 'bg-red-900 bg-opacity-20 border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{test.name}</h3>
                <span
                  className={`px-3 py-1 rounded text-sm font-bold ${
                    test.status === 'PASS' ? 'bg-green-600' : 'bg-red-600'
                  }`}
                >
                  {test.status}
                </span>
              </div>
              <pre className="text-sm bg-black bg-opacity-30 p-3 rounded overflow-auto">
                {JSON.stringify(test.details, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-900 bg-opacity-20 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-semibold mb-2">Next Steps:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>If tables are missing: Run <code className="bg-gray-800 px-1">schema-complete.sql</code> in Supabase SQL Editor</li>
            <li>If not logged in: Go to <a href="/login" className="text-blue-400 underline">/login</a></li>
            <li>If profile missing: Sign up first, then check database</li>
            <li>If role not admin: Run <code className="bg-gray-800 px-1">UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com'</code></li>
          </ul>
        </div>

        <div className="mt-4 space-x-4">
          <button
            onClick={() => runTests()}
            className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
          >
            Re-run Tests
          </button>
          <a
            href="/admin"
            className="inline-block bg-gray-700 px-6 py-2 rounded hover:bg-gray-600"
          >
            Go to Admin
          </a>
          <a
            href="/login"
            className="inline-block bg-gray-700 px-6 py-2 rounded hover:bg-gray-600"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
