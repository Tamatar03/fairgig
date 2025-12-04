import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">FairGig</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/signup"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Real-Time
            <span className="block text-primary-600 mt-2">Exam Proctoring</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            Secure, scalable, and privacy-conscious online exam monitoring. 
            Leveraging advanced computer vision to ensure academic integrity while respecting student privacy.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/signup"
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link 
              href="/support"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors border-2 border-primary-600"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose FairGig?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Detection</h4>
            <p className="text-gray-600">
              Advanced computer vision models detect suspicious behavior including phone usage, 
              multiple faces, gaze tracking, and more with high accuracy.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Privacy First</h4>
            <p className="text-gray-600">
              End-to-end encryption, minimal data retention, and explicit consent. 
              Only snapshots of suspicious events are stored, not continuous video.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">⚡</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Real-Time Monitoring</h4>
            <p className="text-gray-600">
              Sub-500ms latency for ML analysis with live admin dashboard. 
              Proctors can view sessions in real-time via WebRTC.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Analytics</h4>
            <p className="text-gray-600">
              Detailed integrity scores, risk leaderboards, timeline views, 
              and exportable audit logs for complete session transparency.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🌐</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Scalable Infrastructure</h4>
            <p className="text-gray-600">
              Handle thousands of concurrent exams with auto-scaling ML workers, 
              containerized services, and cloud-native architecture.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Resilient & Reliable</h4>
            <p className="text-gray-600">
              Graceful degradation with offline support, automatic retry mechanisms, 
              and local frame buffering ensures uninterrupted exams.
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Enterprise-Grade Security
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-3">🛡️ Authentication & Authorization</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Supabase Auth with JWT tokens</li>
                <li>• Role-based access control (RBAC)</li>
                <li>• Row-level security (RLS) policies</li>
                <li>• Magic link and SSO support</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-3">🔐 Data Protection</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• TLS encryption everywhere (HSTS)</li>
                <li>• Encrypted snapshot storage at rest</li>
                <li>• Short-lived signed URLs (5 min expiry)</li>
                <li>• Configurable retention policies</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-3">📝 Audit & Compliance</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Immutable audit logs (WORM)</li>
                <li>• Tamper-evident metadata</li>
                <li>• Exportable compliance reports</li>
                <li>• Right to be forgotten support</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-lg mb-3">🚫 Tamper Resistance</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• Fullscreen enforcement</li>
                <li>• Tab focus & visibility detection</li>
                <li>• DevTools detection (best-effort)</li>
                <li>• Copy/paste blocking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h5 className="font-bold text-lg mb-4">FairGig</h5>
              <p className="text-gray-400 text-sm">
                AI-powered exam proctoring for the modern education landscape.
              </p>
            </div>
            <div>
              <h6 className="font-semibold mb-3">Product</h6>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/support" className="hover:text-white">Features</Link></li>
                <li><Link href="/support" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/support" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-3">Legal</h6>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-3">Support</h6>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/support" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/support" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} FairGig. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
