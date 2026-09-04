import Link from 'next/link';

export default function ImprintPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-12 space-y-6 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','SF_Pro_Display',sans-serif]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Impressum</h1>
        <Link 
          href="/orders" 
          className="inline-flex items-center min-h-[44px] px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 active:bg-blue-100 rounded-full transition-all touch-manipulation"
        >
          ← Zurück
        </Link>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-xs sm:text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">Angaben gemäß § 5 DDG</h2>
          <p>
            RS Media<br />
            Jonas Salzer<br />
            57642 Alpenrod
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:salzer@r-s-media.de" className="text-blue-600 hover:underline">salzer@r-s-media.de</a>
          </p>
        </section>

        <section>
          <h2 className="font-bold text-sm text-gray-900 mb-1">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Jonas Salzer<br />
            RS Media<br />
            57642 Alpenrod
          </p>
        </section>

        <section className="pt-2 border-t border-gray-100">
          <h2 className="font-bold text-sm text-gray-900 mb-1">Haftungsausschluss & Urheberrecht</h2>
          <p className="text-gray-500">
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Das Urheberrecht an allen Inhalten dieser Web-App (MFA-Webshop) liegt bei Jonas Salzer (RS Media).
          </p>
        </section>
      </div>
    </div>
  );
}
