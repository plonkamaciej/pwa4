# Asystent Diabetyka - Aplikacja PWA

Aplikacja Progressive Web App do zarządzania cukrzycą, która działa również offline.

## Funkcjonalności

- Zapisywanie pomiarów poziomu cukru we krwi
- Przeglądanie historii pomiarów 
- Analiza trendów i statystyk
- Integracja z API pogodowym (wpływ pogody na poziom cukru)
- Możliwość działania offline
- Instalacja na urządzeniu jako aplikacja natywna

## Wymagania techniczne

- Nowoczesna przeglądarka wspierająca PWA (Chrome, Edge, Firefox, Safari)
- Połączenie z internetem przy pierwszym uruchomieniu

## Instalacja

1. Sklonuj to repozytorium
2. Otwórz projekt w swoim ulubionym IDE
3. Wdróż na serwer obsługujący HTTPS (np. Netlify, Firebase Hosting)

## Struktura projektu

```
pwa4/
├── css/               # Style CSS
├── images/            # Grafiki
│   └── icons/         # Ikony dla PWA
├── js/                # Skrypty JavaScript
├── index.html         # Strona główna
├── pomiary.html       # Strona do dodawania pomiarów
├── statystyki.html    # Strona statystyk
├── offline.html       # Strona wyświetlana offline
├── manifest.json      # Manifest PWA
└── sw.js              # Service Worker
```

## Ikony PWA

Aplikacja wymaga ikon w różnych rozmiarach dla prawidłowego działania jako PWA. Minimalne wymagania to ikony 192x192 i 512x512, ale dodatkowe rozmiary poprawią kompatybilność z różnymi urządzeniami.

### Potrzebne ikony

Umieść następujące pliki w katalogu `images/icons/`:

- `icon-72x72.png` (72x72 pikseli)
- `icon-96x96.png` (96x96 pikseli)
- `icon-128x128.png` (128x128 pikseli)
- `icon-144x144.png` (144x144 pikseli)
- `icon-192x192.png` (192x192 pikseli) - **wymagana**
- `icon-512x512.png` (512x512 pikseli) - **wymagana**

Możesz użyć narzędzi online jak [PWA Image Generator](https://tools.crawlink.com/tools/pwa-icon-generator/) do wygenerowania ikon w różnych rozmiarach.

## Wdrożenie na Netlify

1. Utwórz konto na [Netlify](https://www.netlify.com/)
2. Zaloguj się i kliknij "New site from Git"
3. Wybierz swoje repozytorium
4. Nie są wymagane żadne specjalne ustawienia - Netlify automatycznie obsługuje pliki PWA
5. Kliknij "Deploy site"

Po wdrożeniu strona będzie dostępna pod adresem `https://[nazwa-projektu].netlify.app`

## Testowanie PWA

1. Otwórz Chrome DevTools (F12)
2. Przejdź do zakładki "Application"
3. W bocznym panelu znajdziesz sekcje "Service Workers", "Manifest" i "Storage" do testowania funkcji PWA

## Funkcje offline

Aplikacja umożliwia:
- Przeglądanie zapisanych wcześniej pomiarów
- Dodawanie nowych pomiarów (zostaną zsynchronizowane po przywróceniu połączenia)
- Dostęp do podstawowych funkcji i interfejsu

## Licencja

MIT 