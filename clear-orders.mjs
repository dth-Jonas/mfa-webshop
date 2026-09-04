import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Falls du eine Service Account Key Datei nutzt oder Umgebungsvariablen hast:
// Alternativ löschen wir direkt über das Firebase Web SDK mit einem kleinen React/Next.js Script.
