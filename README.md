# Planning Poker App

Prosta aplikacja webowa do Planning Poker z kartami Fibonacci.

## Funkcje
- ✅ Karty Fibonacci (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
- ✅ Tworzenie pokojów z unikalnym kodem
- ✅ Zapraszanie uczestników przez link
- ✅ Real-time synchronizacja (WebSocket)
- ✅ Role: Scrum Master i uczestnicy
- ✅ Zarządzanie głosowaniem

## Technologie
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + Socket.io
- Real-time: WebSocket

## Uruchomienie

### Rozwój
```bash
npm install
npm run dev
```

### Produkcja
```bash
npm run build
npm start
```

## Struktura
```
├── client/          # React frontend
├── server/          # Node.js backend
└── shared/          # Wspólne typy TypeScript
```