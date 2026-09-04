import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Datenschutz</h1>
        <Link 
          href="/orders" 
          className="inline-flex items-center min-h-[44px] px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 active:bg-blue-100 rounded-full transition-all touch-manipulation"
        >
          ← Zurück
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-xs sm:text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">1. Datenschutz auf einen Blick</h2>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">2. Datenerfassung auf unserer Website</h2>
          <p className="mb-2">
            <strong>Wie erfassen wir Ihre Daten?</strong><br />
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. durch das Aufgeben einer Bestellung oder den Login via Google). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (v. a. technische Daten wie Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
          </p>
          <p>
            <strong>Wofür nutzen wir Ihre Daten?</strong><br />
            Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten (wie Ihre Bestellhistorie) können zur Abwicklung Ihrer Bestellung verwendet werden.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">3. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
          </p>
        </section>
      </div>
    </div>
  );
}
