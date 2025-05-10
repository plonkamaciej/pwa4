/**
 * Moduł wykresów dla aplikacji Asystent Diabetyka
 */

/**
 * Tworzy wykres liniowy poziomu glukozy
 * 
 * @param {string} canvasId ID elementu canvas
 * @param {Array} measurements Tablica pomiarów
 * @param {Object} options Opcje wykresu
 */
function createGlucoseChart(canvasId, measurements, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !measurements || measurements.length === 0) return null;
  
  // Sortuj pomiary według daty
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Przygotuj dane
  const dates = sortedMeasurements.map(m => formatDate(m.date));
  const glucoseValues = sortedMeasurements.map(m => m.glucose);
  
  // Funkcja formatująca datę
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Opcje wykresu
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(0, Math.min(...glucoseValues) - 20),
        max: Math.max(...glucoseValues) + 20,
        title: {
          display: true,
          text: 'Poziom glukozy (mg/dL)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data i czas'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            return `Poziom glukozy: ${context.parsed.y} mg/dL`;
          }
        }
      }
    },
    ...options
  };
  
  // Utwórz wykres
  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Poziom glukozy',
        data: glucoseValues,
        borderColor: 'rgba(66, 133, 244, 1)',
        backgroundColor: 'rgba(66, 133, 244, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: 'rgba(66, 133, 244, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.2,
        fill: true
      }]
    },
    options: chartOptions
  });
}

/**
 * Tworzy wykres słupkowy rozkładu pomiarów
 * 
 * @param {string} canvasId ID elementu canvas
 * @param {Array} measurements Tablica pomiarów
 * @param {Object} options Opcje wykresu
 */
function createDistributionChart(canvasId, measurements, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !measurements || measurements.length === 0) return null;
  
  // Przygotuj dane dla rozkładu
  const ranges = [
    { label: '< 70', min: 0, max: 70, color: 'rgba(255, 159, 64, 0.7)' },
    { label: '70-140', min: 70, max: 140, color: 'rgba(75, 192, 192, 0.7)' },
    { label: '141-180', min: 141, max: 180, color: 'rgba(54, 162, 235, 0.7)' },
    { label: '181-250', min: 181, max: 250, color: 'rgba(255, 206, 86, 0.7)' },
    { label: '> 250', min: 251, max: Infinity, color: 'rgba(255, 99, 132, 0.7)' }
  ];
  
  // Oblicz liczbę pomiarów w każdym zakresie
  const rangeCounts = ranges.map(range => {
    return measurements.filter(m => 
      m.glucose >= range.min && m.glucose <= range.max
    ).length;
  });
  
  // Oblicz procenty
  const totalMeasurements = measurements.length;
  const rangePercentages = rangeCounts.map(count => 
    Math.round((count / totalMeasurements) * 100)
  );
  
  // Opcje wykresu
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Procent pomiarów (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Zakres poziomu glukozy (mg/dL)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const count = rangeCounts[context.dataIndex];
            return `${value}% (${count} pomiarów)`;
          }
        }
      }
    },
    ...options
  };
  
  // Utwórz wykres
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ranges.map(r => r.label),
      datasets: [{
        data: rangePercentages,
        backgroundColor: ranges.map(r => r.color),
        borderColor: ranges.map(r => r.color.replace('0.7', '1')),
        borderWidth: 1
      }]
    },
    options: chartOptions
  });
}

/**
 * Tworzy wykres kołowy z podziałem pomiarów na kategorie
 * 
 * @param {string} canvasId ID elementu canvas
 * @param {Array} measurements Tablica pomiarów
 * @param {Object} options Opcje wykresu
 */
function createPieChart(canvasId, measurements, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !measurements || measurements.length === 0) return null;
  
  // Przygotuj dane
  const categories = [
    { name: 'Niski', range: [0, 70], color: 'rgba(255, 159, 64, 0.7)' },
    { name: 'Normalny', range: [70, 180], color: 'rgba(75, 192, 192, 0.7)' },
    { name: 'Wysoki', range: [181, Infinity], color: 'rgba(255, 99, 132, 0.7)' }
  ];
  
  // Oblicz liczbę pomiarów w każdej kategorii
  const counts = categories.map(category => {
    return measurements.filter(m => 
      m.glucose >= category.range[0] && m.glucose <= category.range[1]
    ).length;
  });
  
  // Oblicz procenty
  const total = counts.reduce((sum, count) => sum + count, 0);
  const percentages = counts.map(count => Math.round((count / total) * 100));
  
  // Opcje wykresu
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const count = counts[context.dataIndex];
            return `${context.label}: ${value}% (${count} pomiarów)`;
          }
        }
      }
    },
    ...options
  };
  
  // Utwórz wykres
  return new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels: categories.map(c => c.name),
      datasets: [{
        data: percentages,
        backgroundColor: categories.map(c => c.color),
        borderColor: categories.map(c => c.color.replace('0.7', '1')),
        borderWidth: 1
      }]
    },
    options: chartOptions
  });
}

/**
 * Aktualizuje istniejący wykres nowymi danymi
 * 
 * @param {Chart} chart Obiekt wykresu
 * @param {Array} measurements Nowe pomiary
 */
function updateGlucoseChart(chart, measurements) {
  if (!chart || !measurements) return;
  
  // Sortuj pomiary według daty
  const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Funkcja formatująca datę
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Aktualizuj dane
  chart.data.labels = sortedMeasurements.map(m => formatDate(m.date));
  chart.data.datasets[0].data = sortedMeasurements.map(m => m.glucose);
  
  // Aktualizuj skalę Y
  const glucoseValues = sortedMeasurements.map(m => m.glucose);
  chart.options.scales.y.min = Math.max(0, Math.min(...glucoseValues) - 20);
  chart.options.scales.y.max = Math.max(...glucoseValues) + 20;
  
  // Aktualizuj wykres
  chart.update();
} 