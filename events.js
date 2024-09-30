// API-Keys und Konfigurationen
const clientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
const clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret
const predictHQApiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI'; // PredictHQ API-Key

let genreStreamChartInstance; // Für die Spotify-Genre-Popularitätsanalyse
let genreTrendChartInstance;  // Für die Entwicklung der Genres

// Subgenres definieren für verschiedene Genres
const subgenresMap = {
  rock: ['rock', 'classic rock', 'alternative rock', 'hard rock', 'indie rock', 'progressive rock', 'soft rock'],
  pop: ['pop', 'indie pop', 'electropop', 'synthpop', 'dance pop', 'teen pop', 'k-pop'],
  hiphop: ['hip hop', 'trap', 'rap', 'gangsta rap', 'boom bap', 'conscious hip hop', 'crunk'],
  jazz: ['jazz', 'smooth jazz', 'bebop', 'vocal jazz', 'free jazz', 'fusion jazz', 'swing'],
  metal: ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'doom metal', 'power metal'],
  electronic: ['electronic', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'electro']
};

// Verfügbare Genres für die Spotify Stream-Abfrage
const availableGenres = ['rock', 'pop', 'hip-hop', 'jazz', 'metal', 'electronic'];

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

// Main function to trigger the Spotify genre stream analysis
async function searchTopGenresStreams() {
  const country = document.getElementById('country').value; // Get selected country
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
          min: 0,
          max: 100
        }
      }
    }
  });
}

// MusicBrainz: Get Genre Trends over the years using global artist release data with pagination and subgenre support
async function getGenreTrendsOverYears() {
  const genre = document.getElementById('trendGenre').value;
  let subgenres = [];

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

  // Überprüfe, ob ein bestehendes Diagramm vorhanden ist, und zerstöre es
  if (genreTrendChartInstance) {
    genreTrendChartInstance.destroy();
  }

  genreTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Beliebtheit des Genres über Jahre (5-Jahres-Durchschnitt)',
        data: values,
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

// Funktionen zur Abfrage von Top 3 Künstlern, Top 3 Songs und Events
async function searchEventsAndTopInSelectedCountry() {
  const genre = document.getElementById('genre').value;
  const country = document.getElementById('country').value;
  
  searchTopSongsInSelectedCountry(country, genre);
  searchTopArtistsInSelectedCountry(country, genre);
  searchEvents(genre, country);
}

// Spotify: Search for top songs by country and genre
async function searchTopSongsInSelectedCountry(country, genre) {
  const token = await getSpotifyToken();

  const topTracksResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&market=${country}&limit=3`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const topTracksData = await topTracksResponse.json();
  displayTopSongs(topTracksData);
}

// Spotify: Search for top artists by country and genre
async function searchTopArtistsInSelectedCountry(country, genre) {
  const token = await getSpotifyToken();

  const topArtistsResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&market=${country}&limit=3`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });

  const topArtistsData = await topArtistsResponse.json();
  displayTopArtists(topArtistsData);
}

// Display the top 3 artists
function displayTopArtists(topArtistsData) {
  const resultDiv = document.getElementById('spotify-artists');
  resultDiv.innerHTML = ''; // Clear previous results

  if (topArtistsData.artists && topArtistsData.artists.items.length > 0) {
    topArtistsData.artists.items.forEach((artist) => {
      resultDiv.innerHTML += `
        <div>
          <p>${artist.name}</p>
        </div>`;
    });
  } else {
    resultDiv.innerHTML += '<p>No artists found</p>';
  }
}

// Display the top 3 songs
function displayTopSongs(topTracksData) {
  const resultDiv = document.getElementById('spotify-songs');
  resultDiv.innerHTML = ''; // Clear previous results

  if (topTracksData.tracks && topTracksData.tracks.items.length > 0) {
    topTracksData.tracks.items.forEach((track) => {
      resultDiv.innerHTML += `
        <div>
          <p>${track.name}</p>
        </div>`;
    });
  } else {
    resultDiv.innerHTML += '<p>No songs found</p>';
  }
}

// PredictHQ: Search for events by music genre and country
function searchEvents(genre, country) {
  const url = `https://api.predicthq.com/v1/events/?q=${encodeURIComponent(genre)}&country=${encodeURIComponent(country)}`;
  
  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${predictHQApiKey}`,
      'Accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    displayEvents(data);
  })
  .catch(error => {
    console.error('Error fetching events:', error);
    document.getElementById('result').innerHTML = '<p>Error fetching events. Try again later.</p>';
  });
}

// Display events for selected country and genre
function displayEvents(eventsData) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = ''; // Clear previous results

  if (eventsData && eventsData.results.length > 0) {
    eventsData.results.forEach(event => {
      resultDiv.innerHTML += `
        <div>
          <h4>${event.title}</h4>
          <p>Date: ${new Date(event.start).toLocaleDateString()}</p>
          <p>Location: ${event.location[0]}, ${event.location[1]}</p>
        </div>
        <hr>`;
    });
  } else {
    resultDiv.innerHTML += '<p>No events found</p>';
  }
}
