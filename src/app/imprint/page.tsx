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
        <h2 className="font-bold text-base text-gray-900">Angaben gemäß § 5 TMG</h2>
        <p>
          Jonas Salzer (RS Media)<br />
          Musterstraße 1<br />
          57627 Hachenburg
        </p>

        <h2 className="font-bold text-base text-gray-900">Kontakt</h2>
        <p>
          E-Mail: info@jonassalzer.de
        </p>

        <h2 className="font-bold text-base text-gray-900">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Jonas Salzer<br />
          Musterstraße 1<br />
          57627 Hachenburg
        </p>
      </div>
    </div>
  );
}
