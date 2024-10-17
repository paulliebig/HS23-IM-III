// API-Keys und Konfigurationen
const clientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
const clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret
const predictHQApiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI'; // PredictHQ API-Key


let genreStreamChartInstance; // Für die Spotify-Genre-Popularitätsanalyse
let genreTrendChartInstance;  // Für die Entwicklung der Genres

let selectedCountry = ''; // Gespeicherte Auswahl des Landes
let date = document.querySelector("#datePicker").value  



// Subgenres definieren für verschiedene Genres
const subgenresMap = {
  rock: ['rock', 'classic rock', 'alternative rock', 'hard rock', 'indie rock', 'progressive rock', 'soft rock'],
  pop: ['pop', 'indie pop', 'electropop', 'synthpop', 'dance pop', 'teen pop', 'k-pop'],
  hiphop: ['hip hop', 'trap', 'rap', 'gangsta rap', 'boom bap', 'conscious hip hop', 'crunk'],
  jazz: ['jazz', 'smooth jazz', 'bebop', 'vocal jazz', 'free jazz', 'fusion jazz', 'swing'],
  electronic: ['electronic', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'electro']
};

// Verfügbare Genres für die Spotify Stream-Abfrage
const availableGenres = ['rock', 'pop', 'hip-hop', 'jazz', 'electronic'];

// Spotify: Get access token via Client Credentials Flow
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials'
    })
  });

  const data = await response.json();
  return data.access_token; // Return access token
}

async function searchTopGenresStreams() {
  let country = document.getElementById('streamCountry').value; // Hol das ausgewählte Land


  let genre = document.getElementById('genre').value; // Hol das ausgewählte Genre
  // Event-Listener für die Genre-Auswahl hinzufügen
document.getElementById('genre').addEventListener('change', function() {
  // Hole das ausgewählte Genre
  const selectedGenre = this.value;

  // Hole das aktuell ausgewählte Land
  const selectedCountry = document.getElementById('streamCountry').value;

  // Aktualisiere die Charts, Rankings und Events basierend auf dem Genre und dem Land
  searchEventsAndTopInSelectedCountry(selectedCountry, selectedGenre);
  searchTopGenresStreams();
  getGenreTrendsOverYears();
});
  // Standardwerte setzen, falls kein Land oder Genre ausgewählt wurde
  if (!country) {
    country = 'CH'; // Standardmäßig Schweiz
  }
  if (!genre) {
    genre = 'rock'; // Standardmäßig Rock
  }

  const token = await getSpotifyToken();

  // Erstelle ein leeres Objekt, um die durchschnittliche Popularität pro Genre zu speichern
  let genrePopularity = {};

  // Gehe durch alle verfügbaren Genres und hole die Daten ab
  for (const genre of availableGenres) {
    try {
      const averagePopularity = await calculateAverageGenrePopularity(genre, country, token);
      genrePopularity[genre] = averagePopularity; // Speichere die durchschnittliche Popularität für das Genre
    } catch (error) {
      console.error(`Error fetching genre popularity for ${genre}:`, error);
    }
  }

  // Zeichne das Balkendiagramm basierend auf der durchschnittlichen Popularität der Genres
  displayAverageGenrePopularityChart(genrePopularity);
}


// Spotify: Fetch and calculate average popularity points for a genre and country
async function calculateAverageGenrePopularity(genre, country, token) {
  const market = country !== 'worldwide' ? `&market=${country}` : ''; // Country or worldwide market
  let totalPopularity = 0;
  let trackCount = 0;

  try {
    const apiUrl = `https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=50${market}`;
    const topTracksResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const topTracksData = await topTracksResponse.json();

    // Summiere die Popularität der Top-Tracks in diesem Genre
    topTracksData.tracks.items.forEach(track => {
      totalPopularity += track.popularity; // Popularität jedes Tracks (0-100)
      trackCount++;
    });

  } catch (error) {
    console.error(`Error fetching tracks for genre ${genre} in ${country}:`, error);
  }

  // Berechne den Durchschnitt der Popularität, wenn mindestens ein Track vorhanden ist
  const averagePopularity = trackCount > 0 ? totalPopularity / trackCount : 0;
  return averagePopularity; // Durchschnittliche Popularität für das Genre
}

// Display the average genre popularity as a bar chart
function displayAverageGenrePopularityChart(genrePopularity) {
  const ctx = document.getElementById('genreStreamChart').getContext('2d');

  // Erstelle Daten für das Balkendiagramm
  const labels = Object.keys(genrePopularity); // Die Genres
  const data = Object.values(genrePopularity); // Die durchschnittliche Popularität

  // Überprüfe, ob ein bestehendes Diagramm vorhanden ist, und zerstöre es
  if (genreStreamChartInstance) {
    genreStreamChartInstance.destroy();
  }

  genreStreamChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Durchschnittliche Popularität (0-100) für Genres',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Genres'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Durchschnittliche Popularität (0-100)'
          },
          min: 60,
          max: 100
        }
      }
    }
  });
}

// MusicBrainz: Get Genre Trends over the years using global artist release data with pagination and subgenre support
async function getGenreTrendsOverYears() {
  const genre = document.getElementById('trendGenre').value;
  let subgenres = subgenresMap[genre] || [genre]; // Fallback auf das Hauptgenre

  // Prüfe, ob es definierte Subgenres für das ausgewählte Genre gibt
  if (subgenresMap[genre]) {
    subgenres = subgenresMap[genre];
  } else {
    subgenres = [genre]; // Nur das Hauptgenre abfragen, falls keine Subgenres definiert sind
  }

  let allReleaseGroups = [];
  let totalRecords = 0;

  // Abrufen der Daten für jedes Subgenre
  for (const subgenre of subgenres) {
    let offset = 0;
    const limit = 100;

    try {
      do {
        const response = await fetch(`https://musicbrainz.org/ws/2/release-group?query=tag:${subgenre}&limit=${limit}&offset=${offset}&fmt=json`, {
          headers: {
            'User-Agent': 'MyMusicApp/1.0 ( myemail@example.com )',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error fetching genre trends: ' + response.statusText);
        }

        const data = await response.json();
        totalRecords = data['release-group-count'];
        allReleaseGroups = allReleaseGroups.concat(data['release-groups']);
        offset += limit; // Erhöhe den Offset, um die nächste Seite zu holen

      } while (offset < totalRecords && offset < 1000); // Begrenze die Abfragen auf max. 1000 Veröffentlichungen pro Subgenre

    } catch (error) {
      console.error(`Error fetching genre trends for ${subgenre}:`, error);
    }
  }

  // Datenverarbeitung
  const yearsMap = new Map(); // Speichere die Anzahl der Veröffentlichungen pro Jahr

  // Durchlaufe alle Release-Groups (Alben, Singles etc.) und zähle Veröffentlichungen pro Jahr
  allReleaseGroups.forEach(releaseGroup => {
    const releaseYear = releaseGroup['first-release-date']?.split("-")[0];
    if (releaseYear) {
      const year = parseInt(releaseYear, 10);
      yearsMap.set(year, (yearsMap.get(year) || 0) + 1); // Zähle Veröffentlichungen pro Jahr
    }
  });

  // Durchschnittswerte über 5 Jahre berechnen
  const fiveYearAverages = calculateFiveYearAverages(yearsMap);

  displayGenreTrends(fiveYearAverages.years, fiveYearAverages.values); // Zeige den Trend im Chart an
}

// Berechne den Durchschnitt für 5 Jahre
function calculateFiveYearAverages(yearsMap) {
  const years = Array.from(yearsMap.keys()).sort(); // Alle Jahre
  const fiveYearAverages = { years: [], values: [] };

  for (let i = 0; i < years.length; i += 5) {
    const fiveYearRange = years.slice(i, i + 5); // Nimm 5 Jahre
    const average = fiveYearRange.reduce((sum, year) => sum + (yearsMap.get(year) || 0), 0) / fiveYearRange.length;
    const middleYear = fiveYearRange[Math.floor(fiveYearRange.length / 2)]; // Mittleres Jahr für den Durchschnitt

    fiveYearAverages.years.push(middleYear);
    fiveYearAverages.values.push(average);
  }

  return fiveYearAverages;
}

// Display the genre trends using Chart.js
function displayGenreTrends(years, values) {
  const ctx = document.getElementById('genreChart').getContext('2d');

  // Filtere die Jahre und die entsprechenden Werte, um nur Daten bis 2020 anzuzeigen
  const filteredYears = years.filter(year => year <= 2020);
  const filteredValues = values.slice(0, filteredYears.length);

  // Überprüfe, ob ein bestehendes Diagramm vorhanden ist, und zerstöre es
  if (genreTrendChartInstance) {
    genreTrendChartInstance.destroy();
  }

  genreTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredYears, // Nur gefilterte Jahre anzeigen
      datasets: [{
        label: 'Beliebtheit des Genres über Jahre (5-Jahres-Durchschnitt)',
        data: filteredValues, // Nur gefilterte Werte anzeigen
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Jahr (Mittelwert von 5 Jahren)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Anzahl Veröffentlichungen (5-Jahres-Durchschnitt)'
          }
        }
      }
    }
  });
}





















// Add EventListener for the date picker
document.getElementById('datePicker').addEventListener('change', function() {
  const selectedDate = this.value;
  const selectedCountry = document.getElementById('streamCountry').value; // Get selected country
  const selectedGenre = document.getElementById('genre').value; // Get selected genre

  // Call the function to search top songs with the new date, country, and genre
  searchTopSongsInSelectedCountry(selectedCountry, selectedGenre, selectedDate);

  // Fetch top artists based on the country, genre, and date
  searchTopArtistsInSelectedCountry(selectedCountry, selectedGenre, selectedDate);
});

// Function to search top songs by country, genre, and date
async function searchTopSongsInSelectedCountry(country, genre, date) {
  try {
      // Fetch top songs data from your PHP endpoint, including the selected date
      const topSongsResponse = await fetch(`https://im3paul.rigged-motion.com/etl/unload.php?country=${encodeURIComponent(country)}&genre=${encodeURIComponent(genre)}&date=${encodeURIComponent(date)}`);
    console.log(topSongsResponse);
      // Ensure the response is successful
      if (!topSongsResponse.ok) {
          throw new Error(`Error fetching songs: ${topSongsResponse.statusText}`);
      }

      // Parse the JSON data
      const topSongsData = await topSongsResponse.json();

      // Display the top 10 songs
      displayTopSongs(topSongsData);
  } catch (error) {
      console.error('Error fetching top songs:', error);
      document.getElementById('spotify-songs').innerHTML = '<p>Fehler beim Abrufen der Songs. Bitte später erneut versuchen.</p>';
  }
}

// Function to display the top songs
function displayTopSongs(topSongsData) {
  const resultDiv = document.getElementById('spotify-songs');
  resultDiv.innerHTML = ''; // Clear previous results

  // Check if there are any songs in the response
  if (Array.isArray(topSongsData) && topSongsData.length > 0) {
      // Display up to 10 songs
      topSongsData.slice(0, 10).forEach((song, index) => {
          resultDiv.innerHTML += `
              <div>
                  <p><strong>${index + 1}. ${song.song}</strong></p>
              </div>`;
      });
  } else {
      resultDiv.innerHTML = '<p>No songs found for the selected country, genre, and date.</p>';
    }
}









 

// Function to search top artists by country, genre, and date
async function searchTopArtistsInSelectedCountry(country, genre, date) {
  try {
      // Fetch top artists data from your PHP endpoint, including the selected date
      const topArtistsResponse = await fetch(`https://im3paul.rigged-motion.com/etl/unload_artists.php?country=${encodeURIComponent(country)}&genre=${encodeURIComponent(genre)}&date=${encodeURIComponent(date)}`);

      console.log(topArtistsResponse);

      // Ensure the response is successful
      if (!topArtistsResponse.ok) {
          throw new Error(`Error fetching artists: ${topArtistsResponse.statusText}`);
      }

      // Parse the JSON data
      const topArtistsData = await topArtistsResponse.json();

      // Display the top 10 artists
      displayTopArtists(topArtistsData);
  } catch (error) {
      console.error('Error fetching top artists:', error);
      document.getElementById('spotify-artists').innerHTML = '<p>Fehler beim Abrufen der Künstlerdaten. Bitte später erneut versuchen.</p>';
  }
}

// Function to display the top artists
function displayTopArtists(topArtistsData) {
  const resultDiv = document.getElementById('spotify-artists');
  resultDiv.innerHTML = ''; // Clear previous results

  // Check if there are any artists in the response
  if (Array.isArray(topArtistsData) && topArtistsData.length > 0) {
      // Display up to 10 artists
      topArtistsData.slice(0, 10).forEach((artist, index) => {
          resultDiv.innerHTML += `
              <div>
                  <p><strong>${index + 1}. ${artist.artist}</strong></p>
              </div>`;
      });
  } else {
      resultDiv.innerHTML = '<p>No artists found for the selected country, genre, and date.</p>';
   }
}













// Liste aller Länder, die wir wollen
const countries = [ 'United States of America', 'Germany', 'United Kingdom', 'Brazil', 'Japan', 'Switzerland' ];

// Karte initialisieren, Zoomsteuerung und Verschieben deaktiviert
const map = L.map('map', { zoomControl: false, dragging: false }).setView([20, 0], 2);

// OpenStreetMap-Kacheln hinzufügen
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Deaktiviere Zoom über Doppelklick und Mausrad
map.scrollWheelZoom.disable();
map.doubleClickZoom.disable();

// GeoJSON-Datei für Ländergrenzen laden
fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
  .then(response => response.json())
  .then(geojsonData => {
    geojsonData.features = geojsonData.features.filter(feature => countries.includes(feature.properties.name));
    console.log(geojsonData.features);

    // Ländergrenzen zur Karte hinzufügen und Klick-Events aktivieren
    L.geoJSON(geojsonData, {
      style: function (feature) {
        return {
          color: "#3388ff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.7
        };
      },
      onEachFeature: function (feature, layer) {
        layer.on('click', function () {
          // Aktion bei Klick: Länderdaten im Alert anzeigen
          searchEventsAndTopInSelectedCountry(feature.id.slice(0, 2));
        });
      }
    }).addTo(map);
  })
  .catch(error => console.error('Fehler beim Laden der GeoJSON-Daten:', error));

  


  // Funktion für Standard-Einträge (z.B. weltweit und Rock)
  window.onload = function() {
    const defaultCountry = 'CH';  // Standardmäßig Schweiz
    const defaultGenre = 'rock';  // Standardmäßig Rock-Genre
  
    // Zeige Standarddaten für Top-Künstler, Songs und Events
    searchEventsAndTopInSelectedCountry(defaultCountry, defaultGenre);
  
    // Zeige die Standard-Spotify-Genre-Streams-Analyse für die Schweiz und Rock
    document.getElementById('streamCountry').value = 'CH';
    document.getElementById('genre').value = 'rock';
    searchTopGenresStreams();
  
    // Zeige die Standard-Musikentwicklungs-Trends für die Schweiz und Rock
    getGenreTrendsOverYears();
  };

  
// Funktion zur Abfrage von Top 3 Künstlern, Top 3 Songs und Events
async function searchEventsAndTopInSelectedCountry(country, genre) {
  console.log('Selected Country:', country);
  // Default-Werte, falls nichts ausgewählt wurde
  country = country || document.getElementById('streamCountry').value;
  genre = genre || document.getElementById('genre').value;

  searchTopSongsInSelectedCountry(country, genre, date);
  searchTopArtistsInSelectedCountry(country, genre, date);
  
}

// Weitere bestehende Funktionen bleiben unverändert (searchTopSongsInSelectedCountry, searchTopArtistsInSelectedCountry, etc.)








// Function to set today's date dynamically
function setDateToToday() {
  const today = new Date(); // Get current date
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Get month and pad with 0 if needed
  const day = String(today.getDate()).padStart(2, '0'); // Get day and pad with 0 if needed

  const formattedDate = `${year}-${month}-${day}`; // Format the date as YYYY-MM-DD

  // Set the max attribute to today's date to prevent future dates
  document.getElementById('datePicker').setAttribute('max', formattedDate);
  
  // Set the value attribute to today's date as the default selected date
  document.getElementById('datePicker').setAttribute('value', formattedDate);
}

// Call the function to initialize the date picker with today's date
setDateToToday();





