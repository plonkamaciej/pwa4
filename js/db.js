/**
 * Moduł obsługi bazy danych IndexedDB dla aplikacji Asystent Diabetyka
 */

// Nazwa i wersja bazy danych
const DB_NAME = 'diabetyk-db';
const DB_VERSION = 1;

// Nazwy magazynów obiektów
const STORES = {
  MEASUREMENTS: 'measurements',
  SETTINGS: 'settings'
};

// Indeksy
const INDEXES = {
  BY_DATE: 'by-date',
  BY_SYNC_STATUS: 'by-sync-status'
};

/**
 * Otwiera połączenie z bazą danych
 * @returns {Promise<IDBDatabase>} Obiekt bazy danych
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = event => {
      console.error('Błąd podczas otwierania bazy danych:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Utwórz magazyn pomiarów, jeśli nie istnieje
      if (!db.objectStoreNames.contains(STORES.MEASUREMENTS)) {
        const measurementsStore = db.createObjectStore(STORES.MEASUREMENTS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        
        // Dodaj indeksy
        measurementsStore.createIndex(INDEXES.BY_DATE, 'date');
        measurementsStore.createIndex(INDEXES.BY_SYNC_STATUS, 'synced');
      }
      
      // Utwórz magazyn ustawień, jeśli nie istnieje
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Dodaje nowy pomiar do bazy danych
 * @param {Object} measurement Obiekt pomiaru do dodania
 * @returns {Promise<number>} ID dodanego pomiaru
 */
async function addMeasurement(measurement) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    // Dodaj status synchronizacji, jeśli nie istnieje
    if (measurement.synced === undefined) {
      measurement.synced = 0; // 0 - niesynchronizowany, 1 - zsynchronizowany
    }
    
    const request = store.add(measurement);
    
    request.onsuccess = event => {
      resolve(event.target.result); // Zwróć ID dodanego pomiaru
    };
    
    request.onerror = event => {
      console.error('Błąd podczas dodawania pomiaru:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Aktualizuje istniejący pomiar w bazie danych
 * @param {Object} measurement Obiekt pomiaru do aktualizacji (musi zawierać id)
 * @returns {Promise<boolean>} Informacja o powodzeniu operacji
 */
async function updateMeasurement(measurement) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    const request = store.put(measurement);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas aktualizacji pomiaru:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Usuwa pomiar z bazy danych
 * @param {number} id ID pomiaru do usunięcia
 * @returns {Promise<boolean>} Informacja o powodzeniu operacji
 */
async function deleteMeasurement(id) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readwrite');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas usuwania pomiaru:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Pobiera pomiar z bazy danych
 * @param {number} id ID pomiaru do pobrania
 * @returns {Promise<Object>} Obiekt pomiaru
 */
async function getMeasurement(id) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readonly');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    const request = store.get(id);
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas pobierania pomiaru:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Pobiera wszystkie pomiary z bazy danych
 * @returns {Promise<Array>} Tablica obiektów pomiarów
 */
async function getAllMeasurements() {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readonly');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    
    const request = store.getAll();
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas pobierania pomiarów:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Pobiera pomiary z określonego zakresu dat
 * @param {Date} startDate Data początkowa zakresu
 * @param {Date} endDate Data końcowa zakresu
 * @returns {Promise<Array>} Tablica obiektów pomiarów
 */
async function getMeasurementsInDateRange(startDate, endDate) {
  const allMeasurements = await getAllMeasurements();
  
  return allMeasurements.filter(measurement => {
    const measurementDate = new Date(measurement.date);
    return measurementDate >= startDate && measurementDate <= endDate;
  });
}

/**
 * Pobiera pomiary, które nie zostały zsynchronizowane
 * @returns {Promise<Array>} Tablica niesynchronizowanych pomiarów
 */
async function getUnsyncedMeasurements() {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.MEASUREMENTS, 'readonly');
    const store = transaction.objectStore(STORES.MEASUREMENTS);
    const index = store.index(INDEXES.BY_SYNC_STATUS);
    
    const request = index.getAll(0); // 0 - niesynchronizowane
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas pobierania niesynchronizowanych pomiarów:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Zapisuje ustawienie w bazie danych
 * @param {string} key Klucz ustawienia
 * @param {*} value Wartość ustawienia
 * @returns {Promise<boolean>} Informacja o powodzeniu operacji
 */
async function saveSetting(key, value) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    const request = store.put({ id: key, value });
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas zapisywania ustawienia:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Pobiera ustawienie z bazy danych
 * @param {string} key Klucz ustawienia
 * @returns {Promise<*>} Wartość ustawienia
 */
async function getSetting(key) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    const request = store.get(key);
    
    request.onsuccess = event => {
      const result = event.target.result;
      resolve(result ? result.value : null);
    };
    
    request.onerror = event => {
      console.error('Błąd podczas pobierania ustawienia:', event.target.error);
      reject(event.target.error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Oblicza statystyki pomiarów z określonego zakresu dat
 * @param {Array} measurements Tablica pomiarów lub null (wtedy pobrane zostaną wszystkie)
 * @returns {Promise<Object>} Obiekt ze statystykami
 */
async function calculateStatistics(measurements = null) {
  if (!measurements) {
    measurements = await getAllMeasurements();
  }
  
  if (!measurements.length) {
    return {
      count: 0,
      avgGlucose: 0,
      minGlucose: 0,
      maxGlucose: 0,
      trend: 'neutral',
      inRange: 0,
      high: 0,
      low: 0
    };
  }
  
  // Sortuj pomiary według daty
  measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Oblicz statystyki
  const glucoseValues = measurements.map(m => m.glucose);
  const avgGlucose = Math.round(glucoseValues.reduce((sum, val) => sum + val, 0) / measurements.length);
  const minGlucose = Math.min(...glucoseValues);
  const maxGlucose = Math.max(...glucoseValues);
  
  // Oblicz trend (porównaj pierwszą i drugą połowę danych)
  let trend = 'neutral';
  if (measurements.length >= 2) {
    const halfIndex = Math.floor(measurements.length / 2);
    const firstHalf = measurements.slice(0, halfIndex);
    const secondHalf = measurements.slice(halfIndex);
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.glucose, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.glucose, 0) / secondHalf.length;
    
    const diff = secondHalfAvg - firstHalfAvg;
    
    if (Math.abs(diff) < 5) {
      trend = 'neutral';
    } else if (diff > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
  }
  
  // Oblicz procent pomiarów w zakresie, wysokich i niskich
  const inRange = measurements.filter(m => m.glucose >= 70 && m.glucose <= 180).length;
  const high = measurements.filter(m => m.glucose > 180).length;
  const low = measurements.filter(m => m.glucose < 70).length;
  
  return {
    count: measurements.length,
    avgGlucose,
    minGlucose,
    maxGlucose,
    trend,
    inRange: Math.round((inRange / measurements.length) * 100),
    high: Math.round((high / measurements.length) * 100),
    low: Math.round((low / measurements.length) * 100)
  };
} 