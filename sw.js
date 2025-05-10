const CACHE_NAME = 'asystent-diabetyka-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/pomiary.html',
  '/statystyki.html',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/api.js',
  '/js/chart.js',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png',
  '/images/favicon.ico',
  '/manifest.json',
  '/offline.html'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  console.log('Service Worker: Instalacja');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Buforowanie zasobów');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktywacja Service Workera
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktywacja');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Czyszczenie starego cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Obsługa żądań - Strategia: Stale-While-Revalidate dla API i Cache-First dla statycznych zasobów
self.addEventListener('fetch', event => {
  // Sprawdź, czy żądanie dotyczy API
  if (event.request.url.includes('api.')) {
    // Strategia Stale-While-Revalidate dla API
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Sprawdź, czy URL ma obsługiwany protokół (http/https)
              const url = new URL(event.request.url);
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                cache.put(event.request, networkResponse.clone());
              } else {
                console.log('Pominięto buforowanie API URL z nieobsługiwanym protokołem:', url.protocol);
              }
              return networkResponse;
            })
            .catch(error => {
              console.error('Fetch failed:', error);
              return new Response(
                JSON.stringify({ 
                  error: 'Brak połączenia z internetem',
                  offline: true 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Strategia Cache-First dla statycznych zasobów
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Zwróć zasób z cache, jeśli istnieje
          if (cachedResponse) {
            return cachedResponse;
          }

          // W przeciwnym razie pobierz z sieci
          return fetch(event.request)
            .then(response => {
              // Sprawdź, czy odpowiedź jest poprawna
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Sklonuj odpowiedź, aby można było ją zapisać w cache
              const responseToCache = response.clone();
              
              // Sprawdź, czy URL ma obsługiwany protokół (http/https)
              const url = new URL(event.request.url);
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              } else {
                console.log('Pominięto buforowanie URL z nieobsługiwanym protokołem:', url.protocol);
              }

              return response;
            })
            .catch(() => {
              // Jeśli strona HTML nie jest dostępna, pokaż stronę offline
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              
              // Dla obrazów można zwrócić placeholder
              if (event.request.destination === 'image') {
                return caches.match('/images/offline-image.png');
              }
              
              // Dla innych zasobów po prostu zwróć błąd
              return new Response('Brak połączenia z internetem', { 
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
  }
});

// Obsługa synchronizacji w tle
self.addEventListener('sync', event => {
  if (event.tag === 'sync-measurements') {
    event.waitUntil(syncMeasurements());
  }
});

// Funkcja do synchronizacji pomiarów w tle
async function syncMeasurements() {
  try {
    // Otwarcie bazy IndexedDB
    const db = await openDB();
    
    // Pobranie niesynchronizowanych pomiarów
    const unsyncedItems = await getUnsyncedMeasurements();
    
    // Jeśli nie ma nic do synchronizacji, zakończ
    if (!unsyncedItems.length) return;
    
    // Wyślij dane do API
    const results = await Promise.allSettled(
      unsyncedItems.map(async item => {
        try {
          const response = await fetch('https://api.example.com/measurements', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
          });
          
          if (response.ok) {
            // Aktualizuj status synchronizacji w IndexedDB
            await updateMeasurementSyncStatus(item.id, 1);
            return { success: true, id: item.id };
          }
          
          return { success: false, id: item.id, error: 'Błąd API' };
        } catch (error) {
          return { success: false, id: item.id, error: error.message };
        }
      })
    );
    
    console.log('Synchronizacja zakończona:', results);
  } catch (error) {
    console.error('Błąd podczas synchronizacji:', error);
  }
}

// Funkcja pomocnicza do otwierania bazy IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('diabetyk-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('measurements')) {
        const store = db.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
        store.createIndex('by-sync-status', 'synced');
      }
    };
  });
}

// Funkcja do pobierania niesynchronizowanych pomiarów
async function getUnsyncedMeasurements() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('measurements', 'readonly');
    const store = transaction.objectStore('measurements');
    const index = store.index('by-sync-status');
    const request = index.getAll(0); // Pobierz wszystkie niesynchronizowane (status=0)
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Funkcja do aktualizacji statusu synchronizacji pomiaru
async function updateMeasurementSyncStatus(id, synced) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('measurements', 'readwrite');
    const store = transaction.objectStore('measurements');
    
    // Najpierw pobierz pomiar
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const measurement = getRequest.result;
      if (measurement) {
        // Aktualizuj status synchronizacji
        measurement.synced = synced;
        
        // Zapisz zaktualizowany pomiar
        const updateRequest = store.put(measurement);
        
        updateRequest.onsuccess = () => {
          resolve(true);
        };
        
        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      } else {
        reject(new Error(`Nie znaleziono pomiaru o ID ${id}`));
      }
    };
    
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
} 