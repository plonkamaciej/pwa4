/**
 * Moduł obsługi API dla aplikacji Asystent Diabetyka
 */

// Klucz API dla OpenWeather (przykładowy, publiczny klucz demonstracyjny)
const WEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608';

// Baza URL dla API pogodowego
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

// Klucz API dla FoodData Central (zastąp DEMO_KEY własnym kluczem z data.gov)
const FOOD_API_KEY = 'DEMO_KEY';

/**
 * Pobiera aktualne dane pogodowe dla określonego miasta
 * 
 * @param {string} city Nazwa miasta
 * @param {string} units Jednostki (metric/imperial), domyślnie metric
 * @param {string} lang Język, domyślnie pl
 * @returns {Promise<Object>} Dane pogodowe
 */
async function getWeatherData(city, units = 'metric', lang = 'pl') {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}/weather?q=${encodeURIComponent(city)}&units=${units}&lang=${lang}&appid=${WEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd podczas pobierania danych pogodowych');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Błąd API pogody:', error);
    throw error;
  }
}

/**
 * Analizuje wpływ pogody na poziom cukru
 * 
 * @param {Object} weatherData Dane pogodowe
 * @returns {Array} Tablica obiektów z informacjami o wpływie
 */
function analyzeWeatherImpact(weatherData) {
  const impact = [];
  
  // Temperatura
  const temp = weatherData.main.temp;
  if (temp > 30) {
    impact.push({
      type: 'warning',
      factor: 'Temperatura',
      message: 'Wysoka temperatura może powodować odwodnienie i wpływać na stężenie glukozy we krwi.'
    });
  } else if (temp < 5) {
    impact.push({
      type: 'warning',
      factor: 'Temperatura',
      message: 'Niska temperatura może prowadzić do wyższych odczytów poziomu cukru we krwi.'
    });
  } else {
    impact.push({
      type: 'good',
      factor: 'Temperatura',
      message: 'Umiarkowana temperatura - korzystna dla kontroli poziomu cukru.'
    });
  }
  
  // Wilgotność
  const humidity = weatherData.main.humidity;
  if (humidity > 80) {
    impact.push({
      type: 'warning',
      factor: 'Wilgotność',
      message: 'Wysoka wilgotność może utrudniać regulację temperatury ciała i wpływać na metabolizm.'
    });
  } else if (humidity < 30) {
    impact.push({
      type: 'warning',
      factor: 'Wilgotność',
      message: 'Niska wilgotność może prowadzić do odwodnienia.'
    });
  } else {
    impact.push({
      type: 'good',
      factor: 'Wilgotność',
      message: 'Umiarkowana wilgotność - korzystna dla kontroli poziomu cukru.'
    });
  }
  
  // Ciśnienie
  const pressure = weatherData.main.pressure;
  if (pressure < 1000) {
    impact.push({
      type: 'info',
      factor: 'Ciśnienie',
      message: 'Niskie ciśnienie atmosferyczne może powodować zmęczenie i wpływać na poziom energii.'
    });
  } else if (pressure > 1025) {
    impact.push({
      type: 'info',
      factor: 'Ciśnienie',
      message: 'Wysokie ciśnienie atmosferyczne może mieć wpływ na krążenie krwi.'
    });
  }
  
  return impact;
}

/**
 * Pobiera porady dotyczące aktywności fizycznej odpowiednie dla aktualnych warunków pogodowych
 * 
 * @param {Object} weatherData Dane pogodowe
 * @returns {Array} Tablica porad
 */
function getExerciseTips(weatherData) {
  const tips = [];
  
  // Temperatura
  const temp = weatherData.main.temp;
  if (temp > 30) {
    tips.push('Unikaj intensywnego wysiłku fizycznego podczas upałów. Ćwicz rano lub wieczorem, gdy jest chłodniej.');
    tips.push('Pamiętaj o częstym pomiarze poziomu cukru podczas ćwiczeń w wysokich temperaturach.');
  } else if (temp < 5) {
    tips.push('W niskich temperaturach organizm może wolniej absorbować insulinę z miejsc iniekcji.');
    tips.push('Przed ćwiczeniami na zewnątrz w zimnie, rozgrzej się najpierw w pomieszczeniu.');
  } else {
    tips.push('Aktualne warunki są dobre do aktywności fizycznej na świeżym powietrzu.');
    tips.push('Pamiętaj, aby dostosować dawkę insuliny do planowanego wysiłku fizycznego.');
  }
  
  // Opady
  if (weatherData.weather[0].main === 'Rain' || weatherData.weather[0].main === 'Snow') {
    tips.push('Podczas opadów, rozważ ćwiczenia w pomieszczeniu zamiast na zewnątrz.');
  }
  
  return tips;
}

/**
 * Pobiera informacje żywieniowe dla określonego produktu
 * 
 * @param {string} query Nazwa produktu do wyszukania
 * @returns {Promise<Object>} Dane żywieniowe
 */
async function getFoodNutritionData(query) {
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${FOOD_API_KEY}&query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd podczas pobierania danych żywieniowych');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Błąd API żywieniowego:', error);
    throw error;
  }
}

/**
 * Analizuje dane żywieniowe dla diabetyków
 * 
 * @param {Object} foodData Dane żywieniowe z API
 * @returns {Array} Tablica obiektów z informacjami ważnymi dla diabetyków
 */
function analyzeFoodForDiabetics(foodData) {
  if (!foodData || !foodData.foods || foodData.foods.length === 0) {
    return [];
  }

  return foodData.foods.map(food => {
    // Znajdź zawartość węglowodanów, cukrów i indeks glikemiczny (jeśli dostępne)
    const carbs = food.foodNutrients.find(n => n.nutrientName?.includes('Carbohydrate'));
    const sugars = food.foodNutrients.find(n => n.nutrientName?.includes('Sugars'));
    
    return {
      name: food.description,
      brandOwner: food.brandOwner || 'Nieznany',
      carbs: carbs ? `${carbs.value} ${carbs.unitName}` : 'Brak danych',
      sugars: sugars ? `${sugars.value} ${sugars.unitName}` : 'Brak danych',
      servingSize: food.servingSize ? `${food.servingSize} ${food.servingSizeUnit}` : 'Brak danych',
      ingredients: food.ingredients || 'Brak danych',
      category: food.foodCategory || 'Brak kategorii',
      diabeticAdvice: sugars && carbs ? 
        (sugars.value > 5 ? 'Wysoka zawartość cukru - spożywaj w ograniczonych ilościach' : 'Umiarkowana zawartość cukru - monitoruj poziom glukozy') : 
        'Brak wystarczających danych do analizy'
    };
  });
}

// Funkcja wywoływana przy ładowaniu strony statystyk
document.addEventListener('DOMContentLoaded', () => {
  const weatherBtn = document.getElementById('weather-btn');
  
  if (weatherBtn) {
    weatherBtn.addEventListener('click', async () => {
      const cityInput = document.getElementById('city-input');
      const weatherResults = document.getElementById('weather-results');
      const weatherImpact = document.getElementById('weather-impact');
      
      if (!cityInput || !weatherResults) return;
      
      const city = cityInput.value.trim();
      if (!city) return;
      
      try {
        weatherResults.innerHTML = '<p class="loading">Ładowanie danych pogodowych...</p>';
        weatherImpact.classList.add('hidden');
        
        const weatherData = await getWeatherData(city);
        const impact = analyzeWeatherImpact(weatherData);
        
        // Wyświetl dane pogodowe
        weatherResults.innerHTML = `
          <div class="weather-card">
            <div class="weather-header">
              <h3>${weatherData.name}, ${weatherData.sys.country}</h3>
              <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="${weatherData.weather[0].description}">
            </div>
            <div class="weather-main">
              <div class="temp">${Math.round(weatherData.main.temp)}°C</div>
              <div class="desc">${weatherData.weather[0].description}</div>
            </div>
            <div class="weather-details">
              <div class="detail">
                <span class="label">Odczuwalna:</span>
                <span class="value">${Math.round(weatherData.main.feels_like)}°C</span>
              </div>
              <div class="detail">
                <span class="label">Wilgotność:</span>
                <span class="value">${weatherData.main.humidity}%</span>
              </div>
              <div class="detail">
                <span class="label">Ciśnienie:</span>
                <span class="value">${weatherData.main.pressure} hPa</span>
              </div>
              <div class="detail">
                <span class="label">Wiatr:</span>
                <span class="value">${Math.round(weatherData.wind.speed * 3.6)} km/h</span>
              </div>
            </div>
          </div>
        `;
        
        // Wyświetl wpływ na cukrzycę
        const impactList = document.getElementById('impact-list');
        impactList.innerHTML = '';
        
        impact.forEach(item => {
          const li = document.createElement('li');
          li.className = `impact-item ${item.type}`;
          li.textContent = item.message;
          impactList.appendChild(li);
        });
        
        // Pokaż sekcję wpływu
        weatherImpact.classList.remove('hidden');
        
      } catch (error) {
        console.error('Błąd podczas pobierania danych pogodowych:', error);
        weatherResults.innerHTML = `<p class="error">Nie udało się pobrać danych pogodowych: ${error.message}</p>`;
      }
    });
  }
  
  // Ładowanie porad żywieniowych na stronie głównej
  const nutritionTips = document.getElementById('nutrition-tips');
  if (nutritionTips) {
    // Przykładowe porady żywieniowe dla diabetyków
    const tips = [
      {
        title: 'Indeks glikemiczny',
        content: 'Wybieraj produkty o niskim indeksie glikemicznym, takie jak warzywa, pełnoziarniste produkty i orzechy.'
      },
      {
        title: 'Regularne posiłki',
        content: 'Jedz regularne posiłki, aby utrzymać stabilny poziom cukru we krwi i unikać nagłych skoków.'
      },
      {
        title: 'Białko w każdym posiłku',
        content: 'Dodawaj źródło białka do każdego posiłku, aby spowolnić wchłanianie węglowodanów.'
      }
    ];
    
    // Wygeneruj HTML dla porad
    let html = '<ul class="tips-list">';
    tips.forEach(tip => {
      html += `
        <li class="tip-item">
          <h3>${tip.title}</h3>
          <p>${tip.content}</p>
        </li>
      `;
    });
    html += '</ul>';
    
    nutritionTips.innerHTML = html;
  }
  
  // Obsługa wyszukiwania informacji żywieniowych
  const nutritionSearch = document.getElementById('nutrition-search');
  const nutritionResults = document.getElementById('nutrition-results');
  
  if (nutritionSearch && nutritionResults) {
    const searchForm = nutritionSearch.querySelector('form');
    
    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchInput = searchForm.querySelector('input');
        
        if (!searchInput || !searchInput.value.trim()) return;
        
        const query = searchInput.value.trim();
        
        try {
          nutritionResults.innerHTML = '<p class="loading">Wyszukiwanie informacji żywieniowych...</p>';
          
          const foodData = await getFoodNutritionData(query);
          const analyzedData = analyzeFoodForDiabetics(foodData);
          
          if (analyzedData.length === 0) {
            nutritionResults.innerHTML = '<p class="info">Nie znaleziono informacji o podanym produkcie.</p>';
            return;
          }
          
          // Wyświetl wyniki
          let html = '<div class="food-list">';
          analyzedData.slice(0, 5).forEach(food => {
            html += `
              <div class="food-item">
                <h3>${food.name}</h3>
                <p class="food-brand">${food.brandOwner}</p>
                <div class="food-details">
                  <p><strong>Węglowodany:</strong> ${food.carbs}</p>
                  <p><strong>Cukry:</strong> ${food.sugars}</p>
                  <p><strong>Porcja:</strong> ${food.servingSize}</p>
                  <p><strong>Kategoria:</strong> ${food.category}</p>
                </div>
                <div class="food-advice">
                  <p><strong>Wskazówka dla diabetyków:</strong> ${food.diabeticAdvice}</p>
                </div>
              </div>
            `;
          });
          html += '</div>';
          
          nutritionResults.innerHTML = html;
        } catch (error) {
          nutritionResults.innerHTML = `<p class="error">Wystąpił błąd: ${error.message}</p>`;
        }
      });
    }
  }
}); 