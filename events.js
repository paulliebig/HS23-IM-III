// API-Keys und Konfigurationen
const clientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
const clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret
const predictHQApiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI'; // PredictHQ API-Key

// Spotify: Hole einen Access Token über den Client Credentials Flow
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
  return data.access_token; // Zugriffstoken zurückgeben
}

// Suche nach den Top 3 Songs, Top 3 Künstlern und Events im ausgewählten Land und Genre
function searchEventsAndTopInSelectedCountry() {
  const genre = document.getElementById('genre').value;
  const country = document.getElementById('country').value;

  // Events, Top-Songs und Top-Künstler für das ausgewählte Land und Genre suchen
  searchTopSongsInSelectedCountry(country, genre);
  searchTopArtistsInSelectedCountry(country, genre);
  searchEvents(genre, country);
}

// Spotify: Suche nach den Top-Songs für das ausgewählte Land und Genre
async function searchTopSongsInSelectedCountry(country, genre) {
  try {
    const token = await getSpotifyToken();

    // Anfrage für beliebte Tracks (Songs) im ausgewählten Land und Genre
    const topTracksResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=track&market=${country}&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const topTracksData = await topTracksResponse.json();
    displayTopSongs(topTracksData);
  } catch (error) {
    console.error('Fehler bei der Songs-Anfrage:', error);
    document.getElementById('spotify-songs').innerHTML = '<p>Fehler bei der Songs-Anfrage. Versuche es später erneut.</p>';
  }
}

// Spotify: Suche nach den Top-Künstlern aus den beliebtesten Playlists für das ausgewählte Genre und Land
async function searchTopArtistsInSelectedCountry(country, genre) {
  try {
    const token = await getSpotifyToken();

    // Finde die beliebtesten Künstler basierend auf Genre und Land
    const topArtistsResponse = await fetch(`https://api.spotify.com/v1/search?q=genre:${encodeURIComponent(genre)}&type=artist&market=${country}&limit=3`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const topArtistsData = await topArtistsResponse.json();
    displayTopArtists(topArtistsData);
  } catch (error) {
    console.error('Fehler bei der Künstler-Anfrage:', error);
    document.getElementById('spotify-artists').innerHTML += '<p>Fehler bei der Künstler-Anfrage. Versuche es später erneut.</p>';
  }
}

// Anzeige der Top 3 Künstler basierend auf dem Genre und Land
function displayTopArtists(topArtistsData) {
  const resultDiv = document.getElementById('spotify-artists');
  resultDiv.innerHTML = '';  // Lösche alte Ergebnisse

  if (topArtistsData.artists && topArtistsData.artists.items.length > 0) {
    topArtistsData.artists.items.forEach((artist, index) => {
      if (index < 3) {
        resultDiv.innerHTML += `<p><b>${artist.name}</b><br>Link: <a href="${artist.external_urls.spotify}" target="_blank">${artist.external_urls.spotify}</a></p>`;
      }
    });
  } else {
    resultDiv.innerHTML += '<p>Keine Künstler gefunden</p>';
  }
}

// Spotify: Anzeige der Top 3 Songs
function displayTopSongs(topTracksData) {
  const resultDiv = document.getElementById('spotify-songs');
  resultDiv.innerHTML = '';  // Lösche alte Ergebnisse

  if (topTracksData.tracks && topTracksData.tracks.items.length > 0) {
    topTracksData.tracks.items.forEach((track, index) => {
      if (index < 3) {
        resultDiv.innerHTML += `<p><b>${track.name}</b> von ${track.artists.map(artist => artist.name).join(', ')}<br>Link: <a href="${track.external_urls.spotify}" target="_blank">${track.external_urls.spotify}</a></p>`;
      }
    });
  } else {
    resultDiv.innerHTML += '<p>Keine Songs gefunden</p>';
  }
}

// PredictHQ: Suche nach Events basierend auf Musikrichtung und Land
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
    if (!response.ok) throw new Error('Fehler bei der Events-Anfrage: ' + response.statusText);
    return response.json();
  })
  .then(data => {
    displayEvents(data);
  })
  .catch(error => {
    console.error('Fehler bei der Events-Anfrage:', error);
    document.getElementById('result').innerHTML = '<p>Fehler bei der Events-Anfrage. Versuche es später erneut.</p>';
  });
}

// PredictHQ: Anzeige der Events
function displayEvents(data) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';  // Lösche alte Ergebnisse

  const currentDate = new Date();
  const futureEvents = data.results.filter(event => new Date(event.start) > currentDate);

  futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  if (futureEvents.length > 0) {
    futureEvents.forEach(event => {
      const location = event.entity ? event.entity.name : 'Ort nicht verfügbar';
      const date = event.start ? new Date(event.start).toLocaleDateString() : 'Datum nicht verfügbar';
      resultDiv.innerHTML += `<p><b>${event.title}</b><br>Ort: ${location}<br>Datum: ${date}</p>`;
    });
  } else {
    resultDiv.innerHTML = '<p>Keine zukünftigen Events gefunden</p>';
  }
}