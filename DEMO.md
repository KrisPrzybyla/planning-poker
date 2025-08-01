# 🃏 Planning Poker - Demo

## ✅ Aplikacja gotowa!

### Funkcje zaimplementowane:
- ✅ **Karty Fibonacci**: 0, 1, 2, 3, 5, 8, 13, 21, ?, ☕
- ✅ **Tworzenie pokojów** z unikalnym kodem (6 znaków)
- ✅ **Zapraszanie uczestników** przez kod pokoju
- ✅ **Real-time synchronizacja** (WebSocket/Socket.io)
- ✅ **Role użytkowników**: Scrum Master i uczestnicy
- ✅ **Zarządzanie głosowaniem**: start/stop/reset/reveal
- ✅ **Statystyki głosowania**: średnia, consensus, rozkład
- ✅ **Responsive design** z Tailwind CSS

### Jak uruchomić:

#### Opcja 1: Automatycznie
```bash
npm run dev
```

#### Opcja 2: Ręcznie
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm start
```

### Dostęp:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health check**: http://localhost:3001/health

### Jak używać:

1. **Scrum Master**:
   - Otwórz http://localhost:3000
   - Kliknij "Utwórz pokój"
   - Wpisz nazwę pokoju i swoje imię
   - Udostępnij kod pokoju zespołowi

2. **Uczestnicy**:
   - Otwórz http://localhost:3000
   - Kliknij "Dołącz do pokoju"
   - Wpisz kod pokoju i swoje imię

3. **Głosowanie**:
   - Scrum Master wprowadza story i rozpoczyna głosowanie
   - Uczestnicy wybierają karty Fibonacci
   - Scrum Master ujawnia wyniki gdy wszyscy zagłosują
   - Możliwość resetowania i ponownego głosowania

### Karty specjalne:
- **?** = "Nie wiem / Potrzebuję więcej informacji"
- **☕** = "Potrzebuję przerwy"

### Technologie:
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Real-time**: WebSocket
- **Baza danych**: In-memory (dla demo)

## 🚀 Gotowe do użycia!