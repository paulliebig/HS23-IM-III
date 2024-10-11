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
function getTopArtistsByCountryAndGenre($country, $genre, $spotifyToken, $limit = 10) {
    $url = "https://api.spotify.com/v1/search?q=genre:" . urlencode($genre) . "&type=artist&limit=" . $limit . "&market=" . $country;

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

// Spotify Token holen
$spotifyToken = getSpotifyToken($spotifyClientId, $spotifyClientSecret);

// Array, um alle Künstler und Genres zu speichern
$artistDataArray = [];
$genreCount = [
    'rock' => 0, 'pop' => 0, 'hip-hop' => 0, 'jazz' => 0, 'metal' => 0, 'electronic' => 0
];

// Funktion, um die Künstlerdaten zu sammeln, bis das Limit erreicht ist
function collectArtists($genre, $mainGenre, $countries, $spotifyToken, &$genreCount, &$artistDataArray) {
    foreach ($countries as $country) {
        if ($genreCount[$mainGenre] < 60) {
            // Versuche zuerst, die Top 10 Künstler zu holen
            $topArtists = getTopArtistsByCountryAndGenre($country, $genre, $spotifyToken, 10);
            foreach ($topArtists as $index => $artist) {
                if ($genreCount[$mainGenre] >= 60) break;
                $artistName = $artist['name'] ?? 'Unknown';
                $artistGenres = implode(', ', $artist['genres'] ?? ['Unknown']);
                
                // Genre vereinfachen
                $simplifiedGenre = simplifyGenre($artistGenres, [$mainGenre => [$genre]]);
                if ($simplifiedGenre == ucfirst($mainGenre)) {
                    // Füge Künstler zum Array hinzu, wenn Genre passt
                    $artistDataArray[] = [
                        "country" => $country,
                        "artist_name" => $artistName,
                        "genre" => $simplifiedGenre,
                        "rank" => $index + 1
                    ];
                    $genreCount[$mainGenre]++;
                }
            }

            // Wenn noch weniger als 60, hole mehr Künstler, um aufzufüllen
            if ($genreCount[$mainGenre] < 60) {
                $additionalArtists = getTopArtistsByCountryAndGenre($country, $genre, $spotifyToken, 50);
                foreach ($additionalArtists as $index => $artist) {
                    if ($genreCount[$mainGenre] >= 60) break;
                    $artistName = $artist['name'] ?? 'Unknown';
                    $artistGenres = implode(', ', $artist['genres'] ?? ['Unknown']);
                    
                    $simplifiedGenre = simplifyGenre($artistGenres, [$mainGenre => [$genre]]);
                    if ($simplifiedGenre == ucfirst($mainGenre)) {
                        $artistDataArray[] = [
                            "country" => $country,
                            "artist_name" => $artistName,
                            "genre" => $simplifiedGenre,
                            "rank" => $index + 1
                        ];
                        $genreCount[$mainGenre]++;
                    }
                }
            }
        }
    }
}

// Für jedes Genre Künstler sammeln, bis 60 pro Genre erreicht sind
foreach ($mainGenres as $mainGenre => $subgenres) {
    foreach ($subgenres as $subgenre) {
        collectArtists($subgenre, $mainGenre, $countries, $spotifyToken, $genreCount, $artistDataArray);
    }
}

// Ausgabe des Ergebnisses (Beispiel für print_r zur Anzeige)
echo "<pre>";
print_r($artistDataArray);
echo "</pre>";

return $artistDataArray;

?>