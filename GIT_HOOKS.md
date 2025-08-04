# Git Hooks - Automatyczne Testowanie

## Opis

Projekt został skonfigurowany z automatycznymi Git hooks, które uruchamiają testy przed każdym commitem. To zapewnia, że kod w repozytorium zawsze przechodzi wszystkie testy.

## Konfiguracja

### Husky
- **Narzędzie**: Husky v9.1.7
- **Plik konfiguracyjny**: `.husky/pre-commit`
- **Funkcja**: Automatyczne uruchamianie testów przed commitem

### Dostępne Hook'i

#### 1. Standardowy Pre-commit Hook
**Plik**: `.husky/pre-commit`

Uruchamia:
- Wszystkie testy React (67 testów)
- Wszystkie testy backend (8 testów)

```bash
# Testuje hook ręcznie
./.husky/pre-commit
```

#### 2. Lint-staged Hook (alternatywa)
**Plik**: `.husky/pre-commit-lint-staged`
**Konfiguracja**: `.lintstagedrc.json`

Uruchamia tylko dla zmienionych plików:
- ESLint z automatycznymi poprawkami
- Testy React i backend
- Prettier dla plików JSON/MD

```bash
# Aby użyć lint-staged zamiast standardowego hook'a:
mv .husky/pre-commit .husky/pre-commit-backup
mv .husky/pre-commit-lint-staged .husky/pre-commit
chmod +x .husky/pre-commit
```

## Jak to działa

1. **Przed commitem**: Git automatycznie uruchamia `.husky/pre-commit`
2. **Testy**: Uruchamiane są wszystkie testy React i backend
3. **Sukces**: Jeśli wszystkie testy przejdą ✅ - commit jest wykonywany
4. **Błąd**: Jeśli jakiś test nie przejdzie ❌ - commit jest blokowany

## Korzyści

✅ **Jakość kodu**: Zapewnia, że tylko działający kod trafia do repozytorium
✅ **Wczesne wykrywanie błędów**: Problemy są wykrywane przed push'em
✅ **Oszczędność czasu**: Zapobiega problemom w CI/CD
✅ **Dyscyplina zespołu**: Wymusza uruchamianie testów
✅ **Stabilna gałąź główna**: main/develop zawsze ma działający kod

## Potencjalne wyzwania

⚠️ **Czas commita**: Commit może trwać dłużej (obecnie ~6 sekund)
⚠️ **Frustracja deweloperów**: Może blokować szybkie commit'y
⚠️ **Konfiguracja**: Wymaga odpowiedniej konfiguracji środowiska

## Obejście (w razie potrzeby)

```bash
# Pomiń hook'i w wyjątkowych sytuacjach (NIE ZALECANE)
git commit --no-verify -m "commit message"
```

## Status testów

- **Testy React**: 67 testów w 5 pakietach ✅
- **Testy Backend**: 8 testów w 1 pakiecie ✅
- **Łącznie**: 75 testów ✅

## Rekomendacje

1. **Używaj standardowego hook'a** dla maksymalnej pewności
2. **Rozważ lint-staged** dla większych projektów (szybsze dla małych zmian)
3. **Edukuj zespół** o korzyściach z automatycznego testowania
4. **Monitoruj czas wykonania** i optymalizuj testy jeśli potrzeba