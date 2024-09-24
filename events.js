// API-Keys und Konfigurationen
const clientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
const clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret
const predictHQApiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI'; // PredictHQ API-Key
const lastFmApiKey = '3c59c3be0246ec258433f3d598ddce36'; // Last.fm API Key

// Variable to store the chart instance
let genreChartInstance;

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

// Search for Top 3 Songs, Top 3 Artists, and Events by selected country and genre
function searchEventsAndTopInSelectedCountry() {
  const genre = document.getElementById('genre').value;
  const country = document.getElementById('country').value;

  // Search events, top songs, and top artists
  searchTopSongsInSelectedCountry(country, genre);
  searchTopArtistsInSelectedCountry(country, genre);
  searchEvents(genre, country);
}

// Spotify: Search for top songs by country and genre
async function searchTopSongsInSelectedCountry(country, genre) {
  try {
    const token = await getSpotifyToken();

    const topTracksResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&market=${country}&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const topTracksData = await topTracksResponse.json();
    displayTopSongs(topTracksData);
  } catch (error) {
    console.error('Error fetching songs:', error);
    document.getElementById('spotify-songs').innerHTML = '<p>Error fetching songs. Try again later.</p>';
  }
}

// Spotify: Search for top artists by country and genre
async function searchTopArtistsInSelectedCountry(country, genre) {
  try {
    const token = await getSpotifyToken();

    const topArtistsResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&market=${country}&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const topArtistsData = await topArtistsResponse.json();
    displayTopArtists(topArtistsData);
  } catch (error) {
    console.error('Error fetching artists:', error);
    document.getElementById('spotify-artists').innerHTML += '<p>Error fetching artists. Try again later.</p>';
  }
}

// Display the top 3 artists
function displayTopArtists(topArtistsData) {
  const resultDiv = document.getElementById('spotify-artists');
  resultDiv.innerHTML = ''; // Clear previous results

  if (topArtistsData.artists && topArtistsData.artists.items.length > 0) {
    topArtistsData.artists.items.forEach((artist, index) => {
      if (index < 3) {
        resultDiv.innerHTML += `<p><b>${artist.name}</b><br>Link: <a href="${artist.external_urls.spotify}" target="_blank">${artist.external_urls.spotify}</a></p>`;
      }
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
    topTracksData.tracks.items.forEach((track, index) => {
      if (index < 3) {
        resultDiv.innerHTML += `<p><b>${track.name}</b> by ${track.artists.map(artist => artist.name).join(', ')}<br>Link: <a href="${track.external_urls.spotify}" target="_blank">${track.external_urls.spotify}</a></p>`;
      }
    });
  } else {
    resultDiv.innerHTML += '<p>No songs found</p>';
  }
}

// PredictHQ: Search for events by music genre and country
function searchEvents(genre, country) {
  const url = "https://api.predicthq.com/v1/events/";

  fetch(`${url}?q=${encodeURIComponent(genre)}&country=${encodeURIComponent(country)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${predictHQApiKey}`,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Error fetching events: ' + response.statusText);
    return response.json();
  })
  .then(data => {
    displayEvents(data);
  })
  .catch(error => {
    console.error('Error fetching events:', error);
    document.getElementById('result').innerHTML = '<p>Error fetching events. Try again later.</p>';
  });
}

// Display events
function displayEvents(data) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = ''; // Clear previous results

  const currentDate = new Date();
  const futureEvents = data.results.filter(event => new Date(event.start) > currentDate);

  futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  if (futureEvents.length > 0) {
    futureEvents.forEach(event => {
      const location = event.entity ? event.entity.name : 'Location unavailable';
      const date = event.start ? new Date(event.start).toLocaleDateString() : 'Date unavailable';
      resultDiv.innerHTML += `<p><b>${event.title}</b><br>Location: ${location}<br>Date: ${date}</p>`;
    });
  } else {
    resultDiv.innerHTML = '<p>No upcoming events found</p>';
  }
}

// Last.fm: Get historical genre trends over continents
async function getGenreTrendsOverYears() {
  const genre = document.getElementById('trendGenre').value;

  const continents = ['Europe', 'North America', 'South America', 'Asia', 'Australia', 'Africa'];
  const trendsData = {};

  for (let continent of continents) {
    const response = await fetch(`https://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${genre}&api_key=${lastFmApiKey}&format=json&limit=10`);
    const data = await response.json();

    const totalListeners = data.topartists.artist.reduce((acc, artist) => acc + parseInt(artist.listeners), 0);
    trendsData[continent] = totalListeners;
  }

  displayGenreTrendChart(trendsData);
}

// Display the genre trend chart using Chart.js
function displayGenreTrendChart(trendsData) {
  const ctx = document.getElementById('genreChart').getContext('2d');

  // Destroy the previous chart instance if it exists
  if (genreChartInstance) {
    genreChartInstance.destroy();
  }

  genreChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(trendsData),
      datasets: [{
        label: 'Listeners by Continent',
        data: Object.values(trendsData),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}