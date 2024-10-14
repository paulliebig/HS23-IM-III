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

// Funktion, um die Top 10 Künstler pro Land und Genre von Spotify zu holen
function getTopArtistsByCountryAndGenre($country, $genre, $spotifyToken) {
    $url = "https://api.spotify.com/v1/search?q=genre:" . urlencode($genre) . "&type=artist&limit=10&market=" . $country;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $spotifyToken]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['artists']['items'] ?? [];
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

// Funktion zur Anpassung des Genres basierend auf der Kategorie
function adjustGenreBasedOnCategory($firstGenre, $category) {
    if (stripos($firstGenre, $category) === false) {
        // Wenn das erste Genre nicht mit der Kategorie übereinstimmt, das Genre der Kategorie hinzufügen
        return $firstGenre . ', ' . $category;
    }
    return $firstGenre; // Andernfalls das erste Genre beibehalten
}

// Spotify Token holen
$spotifyToken = getSpotifyToken($spotifyClientId, $spotifyClientSecret);

// Array, um alle Künstler und Genres zu speichern
$artistDataArray = [];

// Für jedes Land und Genre die Top 10 Künstler holen
foreach ($countries as $country) {
    foreach ($mainGenres as $mainGenre => $subgenres) {
        $topArtists = getTopArtistsByCountryAndGenre($country, $mainGenre, $spotifyToken);

        foreach ($topArtists as $index => $artist) {
            $artistName = $artist['name'] ?? 'Unknown';
            $rank = $index + 1;

            // Das erste Genre des Künstlers holen
            $artistGenres = implode(', ', $artist['genres'] ?? ['Unknown']);
            $firstGenre = $artist['genres'][0] ?? 'Unknown';

            // Das Genre basierend auf der Kategorie anpassen
            $adjustedGenre = adjustGenreBasedOnCategory($firstGenre, $mainGenre);

            // Künstler-Array mit angepasstem Genre ergänzen
            $artistDataArray[] = [
                "country" => $country,
                "artist_name" => $artistName,
                "rank" => $rank,
                "genre" => $adjustedGenre
            ];
        }
    }
}

// Ausgabe des Ergebnisses (Beispiel für print_r zur Anzeige)
echo "<pre>";
print_r($artistDataArray);
echo "</pre>";

return $artistDataArray;

?>
