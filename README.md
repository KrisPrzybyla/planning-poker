# Planning Poker

Aplikacja do szacowania zadań metodą Planning Poker w zespołach Scrum.

## Funkcjonalności

- **Fibonacci Planning Poker** - karty z wartościami: 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
- **Tworzenie pokojów** - unikalny 6-znakowy kod dla każdej sesji
- **Zapraszanie uczestników** - przez kod pokoju lub bezpośredni link
- **Real-time synchronizacja** - WebSocket dla natychmiastowych aktualizacji
- **Role użytkowników** - Scrum Master (moderator) i Uczestnicy (członkowie zespołu)
- **Zarządzanie sesjami** - rozpoczynanie głosowania, ujawnianie wyników, resetowanie głosów
- **Statystyki głosowania** - średnia punktów, rozkład głosów, najczęstszy głos

## Technologie

- React + TypeScript
- Chakra UI dla interfejsu użytkownika
- Socket.IO dla komunikacji w czasie rzeczywistym
- Express.js dla serwera backend

## Uruchomienie aplikacji

### Wymagania

- Node.js
- npm

### Instalacja

```bash
# Instalacja zależności
npm install
```

### Uruchomienie w trybie deweloperskim

```bash
# Uruchomienie klienta i serwera jednocześnie
npm run dev:all

# Lub osobno:
# Uruchomienie klienta
npm run dev

# Uruchomienie serwera
npm run server
```

### Budowanie produkcyjne

```bash
npm run build
```

## Struktura projektu

- `/src` - kod źródłowy aplikacji klienckiej
  - `/components` - komponenty React
  - `/context` - kontekst React dla zarządzania stanem
  - `/hooks` - niestandardowe hooki React
  - `/pages` - strony aplikacji
  - `/styles` - style CSS
  - `/types` - definicje typów TypeScript
  - `/utils` - funkcje pomocnicze
- `server.js` - serwer backend z obsługą WebSocket

## Użytkowanie

1. Otwórz aplikację w przeglądarce
2. Utwórz nowy pokój jako Scrum Master lub dołącz do istniejącego pokoju jako Uczestnik
3. Scrum Master może dodawać nowe zadania do oszacowania
4. Uczestnicy głosują, wybierając karty Fibonacci
5. Scrum Master ujawnia wyniki głosowania
6. Wyniki są analizowane i wyświetlane w formie statystyk
