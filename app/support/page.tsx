import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and get help with FairGig
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Documentation</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive guides for students, proctors, and administrators
            </p>
            <a href="#docs" className="text-primary-600 hover:text-primary-700 font-medium">
              Browse docs →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">
              Chat with our support team (Mon-Fri, 9am-5pm)
            </p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Start chat →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">
              Send us an email and we'll respond within 24 hours
            </p>
            <a
              href="mailto:support@fairgig.example.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              support@fairgig.example.com →
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {/* Student FAQs */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">For Students</h3>
              <div className="space-y-4">
                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    What browsers are supported?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    We recommend using the latest versions of Chrome, Firefox, Edge, or Safari.
                    Chrome and Edge provide the best experience. Make sure your browser allows
                    camera and microphone permissions.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    Is my privacy protected during exams?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Yes! We only capture periodic frames (2-5 per second), not continuous video.
                    Only snapshots of suspicious events are stored, and all data is encrypted.
                    See our <Link href="/privacy" className="text-primary-600 underline">Privacy Policy</Link> for details.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    What happens if I lose internet connection during an exam?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Our system has offline resilience. Frames are buffered locally and uploaded
                    when your connection is restored. Your exam will be marked as "degraded" but
                    you can still continue. Contact your instructor if you experience issues.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    What are the system requirements?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    <strong>Minimum:</strong>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Desktop or laptop computer (mobile not recommended)</li>
                      <li>Webcam and microphone</li>
                      <li>Stable internet (5 Mbps or higher)</li>
                      <li>Modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)</li>
                      <li>Screen resolution: 1280×720 or higher</li>
                    </ul>
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    Can I use external monitors or multiple screens?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    This depends on your exam policy. Some exams allow multiple monitors, while
                    others require a single screen. Check with your instructor or the exam
                    settings before starting.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    What triggers an alert?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Our AI detects behaviors such as:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>No face detected or multiple faces</li>
                      <li>Looking away from the screen for extended periods</li>
                      <li>Phone or tablet in view</li>
                      <li>Eyes closed for too long</li>
                      <li>Leaving fullscreen mode</li>
                    </ul>
                    Note: Alerts are reviewed by proctors and may be marked as false positives.
                  </p>
                </details>
              </div>
            </div>

            {/* Admin FAQs */}
            <div className="mt-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">For Administrators</h3>
              <div className="space-y-4">
                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    How do I create an exam?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Log in as an admin, navigate to the exams page, and click "Create Exam".
                    Configure settings such as duration, detection thresholds, and recording
                    preferences. Students can then access the exam via the provided link.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    How accurate is the ML detection?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Our AI models have high accuracy but are not 100% perfect. False positives
                    can occur (e.g., looking away briefly for legitimate reasons). We recommend
                    reviewing all flagged events and marking false positives to improve the
                    model over time.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    Can I export session data?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    Yes! You can export audit logs, session reports, and snapshots. Navigate to
                    the session detail page and click "Export Report". Data is provided in JSON
                    or CSV format.
                  </p>
                </details>

                <details className="border-b border-gray-200 pb-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600">
                    How is data retained?
                  </summary>
                  <p className="mt-2 text-gray-600 pl-4">
                    By default, snapshots are retained for 30 days. You can configure retention
                    per exam (0-365 days). After the retention period, data is automatically
                    deleted. Students can also request early deletion under the Right to be
                    Forgotten.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Documentation */}
        <div id="docs" className="bg-white rounded-xl shadow-md p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Documentation</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Student Guide</h3>
              <p className="text-gray-600 mb-4">
                Step-by-step instructions for taking exams, pre-exam checks, and troubleshooting.
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Read guide →
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Admin Guide</h3>
              <p className="text-gray-600 mb-4">
                Configure exams, monitor sessions, review alerts, and manage users.
              </p>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Read guide →
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">API Reference</h3>
              <p className="text-gray-600 mb-4">
                Complete API documentation for developers integrating with FairGig.
              </p>
              <a href="http://localhost:8000/docs" className="text-primary-600 hover:text-primary-700 font-medium">
                View API docs →
              </a>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Security & Compliance</h3>
              <p className="text-gray-600 mb-4">
                Information about our security practices, data protection, and compliance.
              </p>
              <a href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                Learn more →
              </a>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-primary-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-lg mb-6">
            Our support team is ready to assist you
          </p>
          <a
            href="mailto:support@fairgig.example.com"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
