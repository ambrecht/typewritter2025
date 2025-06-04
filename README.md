# Typewriter App

Eine minimalistische, ablenkungsfreie Schreibumgebung für konzentriertes Arbeiten. Die App bietet intelligente Zeilenumbrüche, Dark Mode und Offline-Funktionalität.

## Features

- ✍️ **Ablenkungsfreies Schreiben**: Minimalistisches Interface ohne Störungen
- 📱 **Responsive Design**: Optimiert für Desktop, Tablet und Mobile
- 🌙 **Dark Mode**: Augenschonender dunkler Modus
- 📏 **Intelligente Zeilenumbrüche**: Automatische Anpassung an Bildschirmgröße
- 💾 **Cloud-Speicherung**: Sichere Speicherung in der Cloud
- 📱 **PWA-Support**: Installierbar als Progressive Web App
- 🔄 **Offline-Funktionalität**: Arbeiten auch ohne Internetverbindung
- ⌨️ **Tastaturnavigation**: Navigation durch vorherige Zeilen mit Pfeiltasten

## Technologie-Stack

- **Framework**: Next.js 14 mit App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18+ 
- pnpm (empfohlen) oder npm

### Installation

1. Repository klonen:
\`\`\`bash
git clone <repository-url>
cd typewriter-app
\`\`\`

2. Abhängigkeiten installieren:
\`\`\`bash
pnpm install
\`\`\`

3. Umgebungsvariablen konfigurieren:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Bearbeiten Sie `.env.local` und setzen Sie:
\`\`\`env
API_KEY=your-api-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

4. Entwicklungsserver starten:
\`\`\`bash
pnpm dev
\`\`\`

Die App ist nun unter `http://localhost:3000` verfügbar.

### Verfügbare Scripts

\`\`\`bash
# Entwicklungsserver starten
pnpm dev

# Produktions-Build erstellen
pnpm build

# Produktionsserver starten
pnpm start

# Tests ausführen
pnpm test

# Tests im Watch-Modus
pnpm test:watch

# Test-Coverage generieren
pnpm test:coverage

# Linting
pnpm lint
\`\`\`

## Produktion

### Build erstellen

\`\`\`bash
pnpm build
\`\`\`

Dies erstellt eine optimierte Produktionsversion in `.next/`.

### Deployment auf Vercel

1. **Automatisches Deployment**:
   - Repository mit Vercel verbinden
   - Vercel erkennt automatisch Next.js und konfiguriert das Deployment

2. **Umgebungsvariablen in Vercel setzen**:
   - Gehen Sie zu Ihrem Vercel-Dashboard
   - Wählen Sie Ihr Projekt aus
   - Navigieren Sie zu "Settings" → "Environment Variables"
   - Fügen Sie hinzu:
     \`\`\`
     API_KEY=your-production-api-key
     NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
     \`\`\`

3. **Manuelles Deployment**:
\`\`\`bash
# Vercel CLI installieren
npm i -g vercel

# Deployment
vercel --prod
\`\`\`

### Umgebungsvariablen

| Variable | Beschreibung | Erforderlich |
|----------|--------------|--------------|
| `API_KEY` | API-Schlüssel für Backend-Kommunikation | Ja |
| `NEXT_PUBLIC_BASE_URL` | Basis-URL der Anwendung | Ja |

## API-Konfiguration

Die App kommuniziert mit einer externen API für die Speicherung von Texten. Der API-Schlüssel wird über die Umgebungsvariable `API_KEY` konfiguriert.

### API-Endpunkte

- `POST /api/save` - Text speichern
- `GET /api/sessions` - Alle Sitzungen abrufen  
- `GET /api/last-session` - Letzte Sitzung abrufen

## PWA-Features

Die App ist als Progressive Web App (PWA) konfiguriert:

- **Offline-Funktionalität**: Service Worker für Caching
- **Installierbar**: Kann auf dem Homescreen installiert werden
- **App-ähnliches Verhalten**: Vollbild-Modus auf mobilen Geräten

## Testing

### Unit Tests

\`\`\`bash
# Alle Tests ausführen
pnpm test

# Tests mit Coverage
pnpm test:coverage

# Tests im Watch-Modus
pnpm test:watch
\`\`\`

### Test-Struktur

- `__tests__/store/` - Store-Logic Tests
- `__tests__/utils/` - Utility-Function Tests  
- `__tests__/api/` - API-Route Tests

## Sicherheit

Die App implementiert verschiedene Sicherheitsmaßnahmen:

- **Content Security Policy (CSP)**
- **Strict Transport Security (HSTS)**
- **X-Frame-Options**
- **X-Content-Type-Options**
- **Referrer Policy**

## Performance-Optimierungen

- **Image Optimization**: Next.js Image-Komponente
- **Code Splitting**: Automatisch durch Next.js
- **Service Worker**: Caching für bessere Performance
- **Preconnect**: DNS-Prefetching für externe Ressourcen

## Browser-Unterstützung

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile Safari 14+
- Chrome Mobile 88+

## Lizenz

[MIT License](LICENSE)

## Support

Bei Fragen oder Problemen erstellen Sie bitte ein Issue im Repository.
