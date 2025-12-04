import Link from 'next/link';

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: December 4, 2025</p>

        <div className="prose prose-blue max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using FairGig ("Service"), you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to abide by the above,
              please do not use this Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              FairGig provides an AI-powered online exam proctoring platform that monitors student
              behavior during assessments using computer vision and machine learning technology.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Obligations</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 For Students</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Provide accurate registration information</li>
              <li>Grant camera and microphone permissions when required</li>
              <li>Maintain a stable internet connection</li>
              <li>Use a compatible browser and device</li>
              <li>Follow exam rules and instructions</li>
              <li>Not attempt to circumvent or tamper with the proctoring system</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 For Administrators</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Configure exams according to institutional policies</li>
              <li>Review flagged events fairly and without bias</li>
              <li>Protect student privacy and data</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the system</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or viruses</li>
              <li>Impersonate another user</li>
              <li>Scrape or harvest data from the Service</li>
              <li>Share your account credentials</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Academic Integrity</h2>
            <p className="text-gray-700 mb-4">
              Students using FairGig for exams agree to uphold academic integrity principles.
              Violations detected by the system may result in:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Flagged events in the proctoring report</li>
              <li>Review by administrators or instructors</li>
              <li>Potential academic penalties as determined by your institution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Service is also governed by our{' '}
              <Link href="/privacy" className="text-primary-600 underline">
                Privacy Policy
              </Link>
              . By using FairGig, you consent to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Collection of webcam frames during exams</li>
              <li>ML analysis of your behavior</li>
              <li>Storage of suspicious event snapshots</li>
              <li>Sharing of exam data with your educational institution</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content, features, and functionality of the Service are owned by FairGig and
              protected by copyright, trademark, and other intellectual property laws. You may
              not copy, modify, distribute, or create derivative works without our permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-gray-700 mb-4">
              We do not guarantee that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>The Service will be uninterrupted or error-free</li>
              <li>ML detections are 100% accurate (false positives/negatives may occur)</li>
              <li>All cheating attempts will be detected</li>
              <li>Data will never be lost or corrupted</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FAIRGIG SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless FairGig from any claims, damages, losses,
              liabilities, and expenses arising from your use of the Service or violation of these
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your access to the Service at any time
              for violations of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of
              [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact</h2>
            <p className="text-gray-700 mb-4">
              Questions about these Terms? Contact us at:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: <a href="mailto:legal@fairgig.example.com" className="text-primary-600 underline">legal@fairgig.example.com</a></li>
              <li>Address: [Your Company Address]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
