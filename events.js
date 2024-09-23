// Funktion zur Suche nach Musik-Events über die PredictHQ API
function searchEvents() {
    // Holen der Benutzerauswahl (Musikrichtung und Land)
    const genre = document.getElementById('genre').value;
    const country = document.getElementById('country').value;
  
    // API-URL und -Token
    const url = "https://api.predicthq.com/v1/events/";
    const apiKey = 'f820AjMrX5hUl1bIfE21o_rinojJens6eo3c0hkI';  // Dein API-Token
  
    // Anfrage an die PredictHQ API senden mit der ausgewählten Musikrichtung und dem Land
    fetch(url + '?q=' + encodeURIComponent(genre) + '&country=' + encodeURIComponent(country), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Netzwerk-Antwort war nicht ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      let resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '';  // Lösche alte Ergebnisse
  
      // Filtere Events, die in der Zukunft liegen
      const currentDate = new Date();
      let futureEvents = data.results.filter(event => new Date(event.start) > currentDate);
  
      // Sortiere die zukünftigen Events nach Datum
      futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
  
      // Überprüfen, ob zukünftige Events gefunden wurden
      if (futureEvents.length > 0) {
        // Jedes Event anzeigen (Ortsname und Datum)
        futureEvents.forEach(event => {
          const location = event.entity ? event.entity.name : 'Ort nicht verfügbar';  // Ortsname, falls vorhanden
          const date = event.start ? new Date(event.start).toLocaleDateString() : 'Datum nicht verfügbar';
          resultDiv.innerHTML += `<p><b>${event.title}</b><br>Ort: ${location}<br>Datum: ${date}</p>`;
        });
      } else {
        resultDiv.innerHTML = '<p>Keine zukünftigen Events gefunden</p>';
      }
    })
    .catch(error => {
      console.error('Fehler bei der API-Anfrage:', error);
      document.getElementById('result').innerHTML = '<p>Fehler bei der API-Anfrage. Versuche es später erneut.</p>';
    });
  }
  