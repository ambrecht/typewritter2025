# Typewriter App

Eine minimalistische, ablenkungsfreie Schreibumgebung, die für konzentriertes Arbeiten entwickelt wurde. Die App emuliert das Gefühl einer klassischen Schreibmaschine mit modernen Features wie Cloud-Speicherung und PWA-Funktionalität.

## Inhaltsverzeichnis

- [Architektur-Überblick](#architektur-überblick)
- [Projektstruktur](#projektstruktur)
- [Technologie-Stack](#technologie-stack)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Deployment](#deployment)
- [Wichtige Konzepte](#wichtige-konzepte)
  - [State Management (Zustand)](#state-management-zustand)
  - [Automatischer Zeilenumbruch](#automatischer-zeilenumbruch)
  - [Responsive Typografie](#responsive-typografie)
- [API-Konfiguration](#api-konfiguration)
- [PWA-Features](#pwa-features)
- [Testing](#testing)

## Architektur-Überblick

- **Framework**: Next.js 14 mit App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Testing**: Unit Tests
- **Deployment**: Vercel

-   **Zustandsverwaltung**: Der gesamte Anwendungszustand wird zentral in einem **Zustand-Store** (`store/typewriter-store.ts`) gehalten. Dies entkoppelt die UI-Komponenten von der Geschäftslogik.
-   **Komponenten-Struktur**: Die UI ist in logische, wiederverwendbare Komponenten unterteilt (`components/`). Die Haupt-Schreibfläche (`WritingArea`) besteht aus weiteren Unterkomponenten (`ActiveLine`, `LineStack`).
-   **Hooks**: Komplexe Logik (Tastatur-Handling, Dimensionsberechnungen, etc.) ist in wiederverwendbare Custom Hooks ausgelagert (`hooks/`).
-   **Styling**: **Tailwind CSS** wird für das Styling verwendet. Globale Stile und Schriftarten werden in `app/globals.css` und `app/layout.tsx` definiert.

## Projektstruktur

\`\`\`
/
├── __tests__/          # Jest-Tests für Store, Utils und API
├── app/
│   ├── api/            # API-Routen (Backend-Proxies)
│   ├── (main)/
│   │   ├── page.tsx    # Hauptkomponente der Anwendung
│   │   └── layout.tsx  # Root-Layout mit Schriftarten
│   └── globals.css     # Globale Stile und Tailwind-Konfiguration
├── components/
│   ├── ui/             # (Optional) Shadcn UI-Komponenten
│   ├── writing-area/   # Unterkomponenten für den Schreibbereich
│   ├── control-bar.tsx # Obere Leiste mit Steuerelementen
│   └── ...             # Weitere UI-Komponenten
├── hooks/              # Benutzerdefinierte React-Hooks
├── lib/                # API-Konfiguration und Hilfsfunktionen
├── public/             # Statische Assets (Icons, Manifest, etc.)
├── store/
│   └── typewriter-store.ts # Zentraler Zustand-Store
├── styles/             # Zusätzliche CSS-Dateien
└── utils/              # Allgemeine Hilfsfunktionen
\`\`\`

## Technologie-Stack

-   **Framework**: Next.js 14 (App Router)
-   **Sprache**: TypeScript
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand
-   **Icons**: Lucide React
-   **Schriftarten**: Next/Font mit Inter (UI) und Lora (Inhalt)
-   **Testing**: Jest + React Testing Library
-   **Deployment**: Vercel

## Lokale Entwicklung

### Voraussetzungen

-   Node.js 18+
-   pnpm (empfohlen) oder npm

### Installation

1.  Repository klonen:
    \`\`\`bash
    git clone <repository-url>
    cd typewriter-app
    \`\`\`

2.  Abhängigkeiten installieren:
    \`\`\`bash
    pnpm install
    \`\`\`

3.  Umgebungsvariablen konfigurieren:
    \`\`\`bash
    cp .env.example .env.local
    \`\`\`
    Bearbeiten Sie `.env.local` und setzen Sie die erforderlichen Werte.

4.  Entwicklungsserver starten:
    \`\`\`bash
    pnpm dev
    \`\`\`
    Die App ist nun unter `http://localhost:3000` verfügbar.

## Deployment

Das Deployment auf Vercel ist der empfohlene Weg.

1.  **Automatisches Deployment**: Verbinden Sie Ihr Git-Repository mit Vercel.
2.  **Umgebungsvariablen**: Konfigurieren Sie die `API_KEY` und `NEXT_PUBLIC_BASE_URL` in den Vercel-Projekteinstellungen.

## Wichtige Konzepte

### State Management (Zustand)

Der `typewriter-store.ts` ist die "Single Source of Truth" für den Zustand der App.

-   **State**: Enthält Daten wie `lines`, `activeLine`, `fontSize`, `darkMode`, etc.
-   **Actions**: Enthält Funktionen zur Manipulation des Zustands, z.B. `setActiveLine`, `addLineToStack`, `saveSession`.
-   **Persistenz**: Der Zustand wird mittels `persist`-Middleware im `localStorage` des Browsers gespeichert, um den Schreibfortschritt zwischen Sitzungen zu erhalten.

### Automatischer Zeilenumbruch

Die Logik für den automatischen Zeilenumbruch befindet sich in der `setActiveLine`-Aktion im Store.

1.  Bei jeder Eingabe wird die `setActiveLine`-Aktion aufgerufen.
2.  Die Funktion misst die Breite des Textes in der `activeLine` mit der `measureTextWidth`-Utility (die die Canvas-API nutzt).
3.  Wenn die Textbreite die verfügbare Containerbreite überschreitet, wird der Text an der passenden Stelle (vorzugsweise bei einem Leerzeichen) umgebrochen.
4.  Der vordere Teil wird zur letzten Zeile im `lines`-Array, der hintere Teil wird zur neuen `activeLine`.
5.  Dieser Prozess wiederholt sich, falls der verbleibende Text immer noch zu lang ist.

### Responsive Typografie

Der `useResponsiveTypography`-Hook passt die Schriftgrößen dynamisch an die Bildschirmbreite an, um eine optimale Lesbarkeit auf allen Geräten zu gewährleisten, insbesondere auf der Vielzahl von Android-Smartphones.

## API-Konfiguration

Die App kommuniziert mit einer externen API. Die Konfiguration befindet sich in `lib/api-config.ts`. Der API-Schlüssel wird sicher über Umgebungsvariablen (`API_KEY`) verwaltet und ist nur serverseitig zugänglich. Die API-Routen in `app/api/` fungieren als sichere Proxies, die den API-Schlüssel hinzufügen, bevor sie die Anfrage an das eigentliche Backend weiterleiten.

## PWA-Features

Die App ist als Progressive Web App (PWA) konfiguriert:

-   **Offline-Funktionalität**: Ein Service Worker (`public/sw.js`) sorgt für das Caching von statischen Assets.
-   **Installierbar**: Über das `public/manifest.json` kann die App auf dem Homescreen installiert werden.

## Testing

Dieses Projekt verwendet **Jest** und **React Testing Library** für Unit Tests. Da kein Test-Script definiert ist, werden die Tests direkt mit `npx jest` ausgeführt.

```bash
# Alle Tests ausführen
npx jest

# Tests im Watch-Modus
npx jest --watch

# Testabdeckung generieren
npx jest --coverage
```

Die Tests befinden sich im Verzeichnis `__tests__/`.

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

-   `pnpm test`: Führt alle Tests aus.
-   `pnpm test:watch`: Startet Tests im Watch-Modus.
-   `pnpm test:coverage`: Generiert einen Coverage-Report.
