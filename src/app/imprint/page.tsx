import Link from 'next/link';

export default function ImprintPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Impressum</h1>
        <Link href="/orders" className="text-sm text-gray-600 hover:text-black">
          ← Zurück zu meinen Bestellungen
        </Link>
      </div>
      
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="font-bold text-base text-gray-900">Angaben gemäß § 5 DDG</h2>
        <p>
          RS Media<br />
          Jonas Salzer<br />
          57642 Alpenrod
        </p>

        <h2 className="font-bold text-base text-gray-900">Kontakt</h2>
        <p>
          E-Mail: salzer@r-s-media.de
        </p>

        <h2 className="font-bold text-base text-gray-900">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          Jonas Salzer<br />
          RS Media<br />
          57642 Alpenrod
        </p>

        <h2 className="font-bold text-base text-gray-900">Haftungsausschluss & Urheberrecht</h2>
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Das Urheberrecht an allen Inhalten dieser Web-App (MFA-Webshop) liegt bei Jonas Salzer (RS Media).
        </p>
      </div>
    </div>
  );
}
