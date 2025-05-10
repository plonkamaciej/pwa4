/**
 * Główny plik JavaScript dla aplikacji Asystent Diabetyka
 */

// Obsługa stanu połączenia
document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    if (isOnline) {
      document.body.classList.remove('offline');
      statusText.textContent = 'Online';
    } else {
      document.body.classList.add('offline');
      statusText.textContent = 'Offline';
    }
  }
  
  // Aktualizuj stan początkowy
  updateOnlineStatus();
  
  // Nasłuchuj na zmiany stanu połączenia
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Obsługa promptu instalacji
  let deferredPrompt;
  const installPrompt = document.getElementById('install-prompt');
  const installBtn = document.getElementById('install-btn');
  const closePromptBtn = document.getElementById('close-prompt');
  
  // Przechwytywanie zdarzenia 'beforeinstallprompt'
  window.addEventListener('beforeinstallprompt', (e) => {
    // Zapobiegaj domyślnemu pokazywaniu promptu
    e.preventDefault();
    // Zapisz zdarzenie, aby później je wywołać
    deferredPrompt = e;
    // Pokaż własny prompt instalacji
    installPrompt.classList.add('show');
  });
  
  // Obsługa kliknięcia przycisku instalacji
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      // Pokaż prompt instalacji
      deferredPrompt.prompt();
      
      // Zaczekaj na decyzję użytkownika
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Użytkownik ${outcome === 'accepted' ? 'zaakceptował' : 'odrzucił'} instalację`);
      
      // Zresetuj zmienną, bo prompt można pokazać tylko raz
      deferredPrompt = null;
      
      // Ukryj prompt
      installPrompt.classList.remove('show');
    });
  }
  
  // Obsługa kliknięcia przycisku zamknięcia promptu
  if (closePromptBtn) {
    closePromptBtn.addEventListener('click', () => {
      installPrompt.classList.remove('show');
      
      // Zapamiętaj, że użytkownik zamknął prompt
      localStorage.setItem('installPromptClosed', 'true');
    });
  }
  
  // Sprawdź, czy aplikacja jest zainstalowana
  window.addEventListener('appinstalled', () => {
    console.log('Aplikacja została zainstalowana!');
    // Ukryj prompt
    installPrompt.classList.remove('show');
  });
  
  // Pokaż różne informacje w zależności od sposobu uruchomienia
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('Aplikacja uruchomiona w trybie standalone');
  }
});

// Obsługa udostępniania (Web Share API)
function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Asystent Diabetyka',
      text: 'Sprawdź tę aplikację do zarządzania cukrzycą!',
      url: window.location.href
    })
    .then(() => console.log('Udostępniono pomyślnie'))
    .catch(error => console.error('Błąd udostępniania:', error));
  } else {
    console.log('Web Share API nie jest obsługiwane');
  }
}

// Obsługa powiadomień
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Ten przeglądarka nie obsługuje powiadomień');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

async function sendNotification(title, options) {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    console.log('Brak uprawnień do wyświetlania powiadomień');
    return;
  }
  
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification(title, options);
}

// Przypomnienie o pomiarze
function scheduleGlucoseReminder() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Kod do zaplanowania przypomnienia
    sendNotification('Czas na pomiar glukozy', {
      body: 'Przypominamy o wykonaniu pomiaru poziomu cukru.',
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: '/pomiary.html'
      },
      actions: [
        {
          action: 'open',
          title: 'Otwórz aplikację'
        },
        {
          action: 'close',
          title: 'Zamknij'
        }
      ]
    });
  }
}

// Obsługa kliknięcia powiadomienia
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
    const notificationData = event.data.notification;
    
    if (notificationData.data && notificationData.data.url) {
      window.open(notificationData.data.url, '_blank');
    }
  }
}); 