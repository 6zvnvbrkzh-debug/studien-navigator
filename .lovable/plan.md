
# StudBudget – MVP Plan

Eine moderne, mobile-first Web-App für Studierende in Deutschland. Wir bauen ein **fokussiertes MVP** mit den wichtigsten Features in hoher Qualität. Jobs, Marktplatz und Versicherungen werden als Platzhalter-Seiten angelegt, damit die Navigation vollständig ist – sie können in späteren Iterationen ausgebaut werden.

## Design

- **Stil:** Clean, minimalistisch, Apple-like Klarheit
- **Farben:** Blau (Primary), Weiß (Background), Rot (Akzent/Warnungen)
- **Mobile-first:** Bottom-Navigation auf Mobile, Sidebar auf Desktop
- **Karten-Layout** für Dashboard und Übersichten
- **Sprache:** Deutsch als Default, Englisch parallel verfügbar (Switcher im Header)

## Seitenstruktur & Navigation

```text
┌─ Landing/Login ──────────────────────┐
│  Onboarding (3 Schritte)             │
└──────────────────────────────────────┘
         │
         ▼
┌─ App (mit Bottom-Nav / Sidebar) ─────┐
│  • Dashboard (Übersicht + Insights)  │
│  • Budget Tracker                    │
│  • BAföG Guide                       │
│  • Jobs (Platzhalter + Seed-Demo)    │
│  • Marktplatz (Platzhalter)          │
│  • Profil (inkl. Sprache, Premium)   │
└──────────────────────────────────────┘
```

## Kernfeatures (MVP)

### 1. Authentifizierung & Onboarding
- Login/Signup per **E-Mail + Passwort** und **Google**
- 3-Schritt-Onboarding: Name & Studienort → Monatliches Budget → BAföG ja/nein
- Profil-Tabelle mit Studi-spezifischen Feldern (Hochschule, Semester, BAföG-Status)

### 2. Budget Tracking (Hauptfeature)
- Schnelle Erfassung von Einnahmen & Ausgaben (Floating-Action-Button)
- Vordefinierte Kategorien: Miete, Essen, Transport, Freizeit, Bildung, Sonstiges
- Monatsübersicht mit **Donut-Chart** (Verteilung) und **Bar-Chart** (Verlauf)
- **Smarte Insights** automatisch generiert: z. B. „Du gibst 32 % für Essen aus – über dem Durchschnitt"
- Sparziel mit Fortschrittsbalken (Gamification)
- Premium: Erweiterte Analysen, Ausgaben-Prognose, Export

### 3. BAföG Guide
- **Schritt-für-Schritt-Anleitung** zur Antragstellung (interaktiv, mit Fortschritt)
- **Dokumenten-Checkliste** (abhakbar, in DB gespeichert)
- **Fristen-Erinnerungen** (Datum-basiert, im Dashboard angezeigt)
- Tipps & FAQ zur Maximierung der Förderung
- Premium: Personalisierte Optimierungstools (Vorbereitung)

### 4. Jobs (Light-Version)
- Liste mit Seed-Daten (10–15 Beispiel-Werkstudentenjobs)
- Filter: Stadt, Gehalt, Remote/Vor-Ort
- Job-Details-Seite + „Als beworben markieren" (einfaches Tracking)
- Premium-Hinweis für KI-Matching (Coming Soon)

### 5. Marktplatz & Versicherungen (Platzhalter)
- Seiten existieren in Navigation, zeigen „Coming Soon" mit Newsletter-Signup
- Saubere Vorbereitung für spätere Iterationen

### 6. Premium (Stripe)
- **Abo: 3,99 €/Monat**
- Stripe Checkout via Edge Function
- Premium-Features im Code mit Feature-Gates abgesichert
- „Premium"-Badge im Profil, Upgrade-CTA an gesperrten Stellen

### 7. Sprache (DE/EN)
- `react-i18next` mit DE als Default
- Sprach-Switcher im Header (🇩🇪 / 🇬🇧)
- Auswahl in Profil/LocalStorage gespeichert
- Vollständige Übersetzung aller UI-Texte, Kategorien und BAföG-Inhalte

## Monetarisierung

- **Free:** Budget Tracking (Basis), BAföG Guide, Job-Liste, Marktplatz-Browsing
- **Premium (3,99 €/Mo via Stripe):** Erweiterte Insights, Ausgaben-Prognose, Export, KI-Job-Matching (Coming Soon), Personalisierte BAföG-Tools

## Technische Details

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui
- **Charts:** Recharts (bereits verfügbar)
- **i18n:** `react-i18next` + `i18next-browser-languagedetector`
- **Backend:** Lovable Cloud (Supabase) – Auth, Datenbank, Edge Functions
- **Datenbank-Tabellen:**
  - `profiles` (user_id, name, hochschule, semester, bafoeg_status, sprache, premium_until)
  - `transactions` (user_id, amount, category, type, date, note)
  - `bafoeg_checklist` (user_id, item_key, completed)
  - `bafoeg_deadlines` (user_id, title, due_date)
  - `jobs` (titel, firma, stadt, gehalt, remote, beschreibung) – Seed-Daten
  - `applications` (user_id, job_id, status, applied_at)
- **RLS-Policies:** Nutzer sehen nur eigene Daten; Jobs sind public-read
- **Stripe Edge Functions:** `create-checkout`, `customer-portal`, `check-subscription` (siehe Lovable Stripe-Knowledge)
- **Google OAuth:** über Lovable Cloud Auth aktiviert

## Was nach dem MVP folgt (nicht in dieser Iteration)

- Echte Job-API-Integration
- Marktplatz mit Chat-Funktion
- Versicherungs-Vergleich mit Affiliate-Links
- KI-basiertes Job-Matching (Lovable AI Gateway)
- Push-Benachrichtigungen
- Automatische Banking-Integration
