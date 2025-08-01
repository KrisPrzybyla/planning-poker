# 🔗 Funkcja zapraszania - Planning Poker

## ✅ Zaimplementowane funkcje zapraszania:

### 1. **Linki zaproszenia**
- Format: `http://localhost:3000/room/ABC123`
- Automatyczne rozpoznawanie kodu pokoju z URL
- Przyjazny interfejs dla zaproszonych użytkowników

### 2. **Kopiowanie do schowka**
- Kopiowanie pełnego linku zaproszenia
- Kopiowanie samego kodu pokoju
- Wsparcie dla starszych przeglądarek (fallback)
- Wizualne potwierdzenie skopiowania

### 3. **Udostępnianie natywne**
- Web Share API na urządzeniach mobilnych
- Automatyczny fallback do kopiowania
- Udostępnianie z tytułem i opisem

### 4. **QR kod (placeholder)**
- Przygotowane miejsce na QR kod
- Wyświetla link do skanowania
- Gotowe do integracji z biblioteką QR

### 5. **Routing i URL**
- Automatyczna aktualizacja URL przy dołączeniu do pokoju
- Czyszczenie URL przy opuszczeniu pokoju
- Obsługa bezpośrednich linków

## 🎯 Jak używać:

### Scrum Master:
1. Utwórz pokój
2. W sekcji "Zaproś uczestników" znajdziesz:
   - Link zaproszenia do kopiowania
   - Kod pokoju do udostępnienia
   - Przyciski do szybkiego kopiowania
   - Opcję udostępniania (na mobile)

### Uczestnicy:
1. **Opcja A**: Kliknij w otrzymany link
2. **Opcja B**: Wpisz kod pokoju ręcznie
3. Wpisz swoje imię i dołącz

## 🔧 Techniczne szczegóły:

### URL Structure:
```
http://localhost:3000/room/ABC123
```

### Funkcje utility:
- `getInviteLink(roomId)` - generuje link zaproszenia
- `getRoomIdFromUrl()` - wyciąga kod z URL
- `updateUrlForRoom(roomId)` - aktualizuje URL
- `clearRoomFromUrl()` - czyści URL
- `copyToClipboard(text)` - kopiuje do schowka

### Komponenty:
- `InviteLink` - główny komponent zapraszania
- `WelcomeScreen` - obsługuje zaproszenia z URL
- `App` - zarządza routingiem

## 🚀 Gotowe do użycia!

Aplikacja automatycznie:
- Rozpoznaje kody pokojów w URL
- Przełącza na zakładkę "Dołącz do pokoju"
- Wypełnia kod pokoju
- Pokazuje informację o zaproszeniu