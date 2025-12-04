import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-600">FairGig</h1>
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back to home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: December 4, 2025</p>

        <div className="prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              FairGig ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              AI-powered exam proctoring service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Email address and display name</li>
              <li>Account credentials (encrypted)</li>
              <li>Profile information and role (student, admin, proctor)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Exam Session Data</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Webcam frames captured during exams (periodic, not continuous)</li>
              <li>Device information (browser, OS, screen resolution)</li>
              <li>Focus scores and ML-generated alerts</li>
              <li>Snapshots of suspicious events only</li>
              <li>Session timestamps and integrity metrics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>IP address and network latency</li>
              <li>Browser type and version</li>
              <li>Session logs and error reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Exam Monitoring:</strong> To detect and prevent academic dishonesty</li>
              <li><strong>Service Delivery:</strong> To provide and maintain our proctoring service</li>
              <li><strong>Security:</strong> To ensure platform security and prevent abuse</li>
              <li><strong>Analytics:</strong> To improve ML models and system performance</li>
              <li><strong>Compliance:</strong> To meet legal and regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Privacy Principles</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Minimal Recording</h3>
            <p className="text-gray-700 mb-4">
              We do NOT record continuous video. Only periodic frames (2-5 fps) are analyzed by our
              ML service, and only snapshots of suspicious events are stored.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Consent</h3>
            <p className="text-gray-700 mb-4">
              Explicit consent is obtained before any recording begins. You have the right to
              decline recording (subject to exam policy).
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.3 Data Retention</h3>
            <p className="text-gray-700 mb-4">
              By default, snapshots are retained for 30 days (configurable per exam). After this
              period, data is automatically deleted. You can request early deletion.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.4 Encryption</h3>
            <p className="text-gray-700 mb-4">
              All data is encrypted in transit (TLS) and at rest. Snapshot access requires
              short-lived signed URLs (5 min expiry).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do NOT sell your personal information. Data is shared only with:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Educational Institutions:</strong> If you're taking an exam administered by your school</li>
              <li><strong>Service Providers:</strong> Cloud hosting (Azure/AWS), database (Supabase)</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data (Right to be Forgotten)</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, contact us at <a href="mailto:privacy@fairgig.example.com" className="text-primary-600 underline">privacy@fairgig.example.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Security Measures</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>End-to-end TLS encryption (HSTS enabled)</li>
              <li>Row-Level Security (RLS) at database level</li>
              <li>Regular security audits and penetration testing</li>
              <li>Encrypted storage with access controls</li>
              <li>Immutable audit logs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Supabase:</strong> Database, auth, and storage</li>
              <li><strong>Sentry:</strong> Error tracking and monitoring</li>
              <li><strong>Cloud Providers:</strong> Azure/AWS/GCP for hosting</li>
            </ul>
            <p className="text-gray-700">
              Each service has its own privacy policy. We recommend reviewing them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service is not intended for children under 13. We do not knowingly collect
              information from children under 13. If you believe we have collected such data,
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: <a href="mailto:privacy@fairgig.example.com" className="text-primary-600 underline">privacy@fairgig.example.com</a></li>
              <li>Address: [Your Company Address]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
