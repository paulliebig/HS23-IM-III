<?php

// API-Keys und Konfigurationen
$spotifyClientId = '4f74336e66a941a3a7d5285f5e207e66'; // Ersetze mit deiner Spotify Client ID
$spotifyClientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3'; // Ersetze mit deinem Spotify Client Secret

$countries = ['US', 'DE', 'JP', 'GB', 'CH', 'BR']; // Länder

// Hauptgenres basierend auf deiner JS-Definition
$mainGenres = [
    'rock' => ['rock', 'classic rock', 'alternative rock', 'hard rock', 'indie rock', 'progressive rock', 'soft rock'],
    'pop' => ['pop', 'indie pop', 'electropop', 'synthpop', 'dance pop', 'teen pop', 'k-pop'],
    'hip-hop' => ['hip hop', 'trap', 'rap', 'gangsta rap', 'boom bap', 'conscious hip hop', 'crunk'],
    'jazz' => ['jazz', 'smooth jazz', 'bebop', 'vocal jazz', 'free jazz', 'fusion jazz', 'swing'],
    'metal' => ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'doom metal', 'power metal'],
    'electronic' => ['electronic', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'electro']
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

// Funktion, um die Top 10 Songs pro Land von Spotify zu holen
function getTopSongsByCountryAndGenre($country, $genre, $spotifyToken) {
    $url = "https://api.spotify.com/v1/search?q=genre:" . urlencode($genre) . "&type=track&limit=10&market=" . $country;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $spotifyToken]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['tracks']['items'] ?? [];
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

// Für jedes Land und Genre die Top 10 Songs holen
foreach ($countries as $country) {
    foreach ($mainGenres as $mainGenre => $subgenres) {
        $topSongs = getTopSongsByCountryAndGenre($country, $mainGenre, $spotifyToken);

        foreach ($topSongs as $index => $song) {
            $songName = $song['name'] ?? 'Unknown';
            $rank = $index + 1;

            // Überprüfen, ob es Künstler gibt und das erste Genre holen
            $artistId = $song['artists'][0]['id'] ?? null;
            $artistGenres = 'Unknown';

            if ($artistId) {
                // Abfrage des Künstlers, um das Genre des Künstlers zu erhalten
                $artistUrl = "https://api.spotify.com/v1/artists/$artistId";
                $ch = curl_init($artistUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $spotifyToken]);
                $artistResponse = curl_exec($ch);
                curl_close($ch);

                $artistData = json_decode($artistResponse, true);
                $artistGenres = implode(', ', $artistData['genres'] ?? ['Unknown']);
            }

            // Genre vereinfachen
            $simplifiedGenre = simplifyGenre($artistGenres, $mainGenres);

            // Song-Array mit Genre ergänzen
            $songDataArray[] = [
                "country" => $country,
                "song_name" => $songName,
                "rank" => $rank,
                "genre" => $simplifiedGenre
            ];
        }
    }
}

// Ausgabe des Ergebnisses (Beispiel für print_r zur Anzeige)
echo "<pre>";
print_r($songDataArray);
echo "</pre>";

return $songDataArray;

?>