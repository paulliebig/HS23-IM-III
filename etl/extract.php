<?php

// API-Keys und Konfigurationen
$spotifyClientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
$spotifyClientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret

$countries = ['US', 'DE', 'JP', 'GB', 'CH', 'BR']; // Länder

// Hauptgenres basierend auf deiner JS-Definition
$mainGenres = [
    'rock' => ['rock'],
    'pop' => ['pop'],
    'hip-hop' => ['hip hop', 'rap'],
    'jazz' => ['jazz'],
    'metal' => ['metal'],
    'electronic' => ['electronic', 'techno', 'house', 'trance']
];

// Funktion, um das Spotify Access Token zu erhalten
function getSpotifyToken($spotifyClientId, $spotifyClientSecret) {
    $url = 'https://accounts.spotify.com/api/token';
    $headers = [
        'Authorization: Basic ' . base64_encode($spotifyClientId . ':' . $spotifyClientSecret),
        'Content-Type: application/x-www-form-urlencoded'
    ];
    $body = 'grant_type=client_credentials';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

// Funktion, um die Top 10 Songs pro Land von MusicBrainz zu holen
function getTopSongsByCountry($country) {
    $url = "https://musicbrainz.org/ws/2/release-group?query=tag:chart&limit=10&country=$country&fmt=json";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['User-Agent: MyMusicApp/1.0 (myemail@example.com)']);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    return $data['release-groups'] ?? [];
}

// Funktion, um das Genre eines Songs von Spotify zu holen
function getSongGenreFromSpotify($songName, $spotifyToken) {
    $url = 'https://api.spotify.com/v1/search?q=' . urlencode($songName) . '&type=track&limit=1';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $spotifyToken]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (!empty($data['tracks']['items'][0]['artists'][0]['id'])) {
        $artistId = $data['tracks']['items'][0]['artists'][0]['id'];

        // Hole die Genres des Künstlers
        $urlArtist = "https://api.spotify.com/v1/artists/$artistId";
        $ch = curl_init($urlArtist);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $spotifyToken]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $responseArtist = curl_exec($ch);
        curl_close($ch);

        $artistData = json_decode($responseArtist, true);
        return implode(', ', $artistData['genres'] ?? ['Unknown']);
    }
    return 'Unknown';
}

// Funktion zur Vereinfachung der Genres auf Hauptgenres
function simplifyGenre($genres, $mainGenres) {
    foreach ($mainGenres as $mainGenre => $keywords) {
        foreach ($keywords as $keyword) {
            if (stripos($genres, $keyword) !== false) {
                return ucfirst($mainGenre); // Hauptgenre zurückgeben, wenn ein Keyword übereinstimmt
            }
        }
    }
    return 'Others'; // Standardwert, wenn kein Hauptgenre passt
}

// Spotify Token holen
$spotifyToken = getSpotifyToken($spotifyClientId, $spotifyClientSecret);

// Array, um alle Songs und Genres zu speichern
$songDataArray = [];

// Für jedes Land die Top 10 Songs holen
foreach ($countries as $country) {
    $topSongs = getTopSongsByCountry($country);

    foreach ($topSongs as $index => $song) {
        $songName = $song['title'] ?? 'Unknown';
        $rank = $index + 1;

        // Genre von Spotify holen
        $songGenre = getSongGenreFromSpotify($songName, $spotifyToken);

        // Genre vereinfachen
        $simplifiedGenre = simplifyGenre($songGenre, $mainGenres);

        // Song-Array mit Genre ergänzen
        $song["genre"] = $simplifiedGenre;

        // Speichere das Ergebnis im Array
        $songDataArray[] = [
            "country" => $country,
            "song_name" => $songName,
            "rank" => $rank,
            "genre" => $simplifiedGenre
        ];
    }
}

// Ausgabe des Ergebnisses (Beispiel für print_r zur Anzeige)
echo "<pre>";
print_r($songDataArray);
echo "</pre>";

return $songDataArray;
?>