// API-Keys und Konfigurationen
const clientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
const clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret
const predictHQApiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI'; // PredictHQ API-Key

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

  // Search for top songs, top artists, and events for the selected country and genre
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

// Fetch and show genre trends across continents for the last 10 years
async function getGenreTrendsOverYears() {
  const token = await getSpotifyToken();
  const genre = document.getElementById('trendGenre').value; // Get selected genre
  const continents = ['EU', 'NA', 'SA', 'AS', 'AU', 'AF']; // Europe, North America, South America, Asia, Australia, Africa

  const trendData = {}; // Store data for each continent

  for (let continent of continents) {
    trendData[continent] = [];

    for (let year = 2014; year <= 2023; year++) {
      // Assume API provides data per year, this is a placeholder to simulate data for years
      const response = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&market=${continent}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await response.json();

      // Store the count of tracks (as a proxy for popularity)
      trendData[continent].push(data.tracks ? data.tracks.items.length : 0);
    }
  }

  renderGenreTrendChart(trendData);
}

// Render chart to show streaming trends
function renderGenreTrendChart(trendData) {
  const ctx = document.getElementById('genreChart').getContext('2d');

  const data = {
    labels: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'], // Last 10 years
    datasets: []
  };

  // Populate datasets for each continent
  for (let continent in trendData) {
    data.datasets.push({
      label: `${continent}`,
      data: trendData[continent],
      borderColor: getRandomColor(),
      fill: false
    });
  }

  new Chart(ctx, {
    type: 'line',
    data: data
  });
}

// Helper function to generate random colors for the chart
function getRandomColor() {
  return `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`;
}