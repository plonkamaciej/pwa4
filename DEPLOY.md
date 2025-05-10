# Wdrożenie Asystenta Diabetyka na Netlify

Ten dokument zawiera instrukcje wdrożenia aplikacji Asystent Diabetyka na platformie Netlify.

## Przygotowanie do wdrożenia

1. Upewnij się, że masz wszystkie niezbędne pliki:
   - Pliki HTML, CSS i JavaScript
   - Obrazy i ikony w odpowiednich katalogach
   - Plik `manifest.json` 
   - Service Worker (`sw.js`)
   - Pliki konfiguracyjne Netlify (`netlify.toml` i `_redirects`)

2. Wszystkie ikony powinny być wygenerowane i umieszczone w katalogu `images/icons/`.

## Wdrożenie za pomocą Netlify Deploy

### Metoda 1: Drag & Drop (najszybsza)

1. Spakuj cały katalog projektu do pliku ZIP lub utrzymuj go jako rozpakowny katalog
2. Przejdź na stronę [Netlify Drop](https://app.netlify.com/drop)
3. Przeciągnij i upuść katalog projektu lub plik ZIP na wskazany obszar
4. Poczekaj na zakończenie wdrożenia

### Metoda 2: Połączenie z GitHub/GitLab/Bitbucket

1. Wypchnij kod do repozytorium Git
2. Zaloguj się na [Netlify](https://app.netlify.com/)
3. Kliknij "New site from Git"
4. Wybierz swojego dostawcę Git (GitHub, GitLab lub Bitbucket)
5. Wybierz repozytorium z kodem aplikacji
6. Skonfiguruj ustawienia budowania:
   - Branch: `main` (lub inny używany)
   - Build command: (pozostaw puste, bo nie używamy procesu budowania)
   - Publish directory: `.` (katalog główny)
7. Kliknij "Deploy site"

## Po wdrożeniu

1. Po wdrożeniu Netlify przypisze domyślną domenę (np. `random-name-123456.netlify.app`)
2. Możesz zmienić tę nazwę w ustawieniach witryny, sekcja "Domain settings"
3. Możesz również skonfigurować własną domenę, jeśli ją posiadasz

## Testowanie po wdrożeniu

1. Sprawdź, czy strona ładuje się poprawnie pod adresem URL wdrożenia
2. Upewnij się, że Service Worker jest zarejestrowany (za pomocą narzędzi deweloperskich Chrome)
3. Przetestuj funkcjonalność offline, wyłączając połączenie internetowe
4. Spróbuj zainstalować aplikację jako PWA z przeglądarki

## Rozwiązywanie problemów

### Problem: Service Worker nie rejestruje się

- Upewnij się, że nagłówki HTTP dla `/sw.js` są poprawnie ustawione
- Sprawdź konsolę przeglądarki pod kątem błędów
- Upewnij się, że witryna jest serwowana przez HTTPS

### Problem: Aplikacja nie może być zainstalowana

- Sprawdź, czy `manifest.json` jest poprawnie załadowany
- Upewnij się, że wszystkie ikony są dostępne pod poprawnymi ścieżkami
- Sprawdź, czy Service Worker jest zarejestrowany

### Problem: Zasoby nie ładują się w trybie offline

- Sprawdź, czy Service Worker prawidłowo buforuje zasoby
- Upewnij się, że wszystkie wymagane zasoby są zdefiniowane w tablicy `ASSETS_TO_CACHE`

## Monitoring i aktualizacje

- Netlify zapewnia podstawowe statystyki ruchu
- Aby wdrożyć aktualizacje, po prostu zaaktualizuj kod w repozytorium Git (metoda 2) lub ponownie wrzuć katalog (metoda 1)
- Monitoruj konsolę przeglądarki użytkowników pod kątem potencjalnych błędów Service Workera lub PWA 