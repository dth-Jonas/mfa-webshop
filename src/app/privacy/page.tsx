import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Datenschutzerklärung</h1>
        <Link href="/orders" className="text-sm text-gray-600 hover:text-black">
          ← Zurück zu meinen Bestellungen
        </Link>
      </div>

      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="font-bold text-base text-gray-900">1. Datenschutz auf einen Blick</h2>
        <p>
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
        </p>

        <h2 className="font-bold text-base text-gray-900">2. Datenerfassung auf unserer Website</h2>
        <p>
          <strong>Wie erfassen wir Ihre Daten?</strong><br />
          Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z. B. durch das Aufgeben einer Bestellung oder den Login via Google). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (v. a. technische Daten wie Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
        </p>
        <p>
          <strong>Wofür nutzen wir Ihre Daten?</strong><br />
          Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten (wie Ihre Bestellhistorie) können zur Abwicklung Ihrer Club-Textilbestellungen verwendet werden.
        </p>

        <h2 className="font-bold text-base text-gray-900">3. Ihre Rechte</h2>
        <p>
          Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
        </p>
      </div>
    </div>
  );
}
