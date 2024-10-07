<?php

function fetchGenrePopularity($genre, $country, $token) {
    $url = "https://api.spotify.com/v1/search?q=genre:" . urlencode($genre) . "&type=track&limit=50&market=" . urlencode($country);
    $headers = [
        'Authorization: Bearer ' . $token
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    $tracks = $data['tracks']['items'];
    
    // Calculate average popularity
    $totalPopularity = 0;
    $trackCount = count($tracks);
    
    foreach ($tracks as $track) {
        $totalPopularity += $track['popularity'];
    }

    return $trackCount > 0 ? $totalPopularity / $trackCount : 0;
}


$countries = ['US', 'DE', 'GB', 'BR', 'JP', 'CH'];  // List of countries
$genres = ['rock', 'pop', 'hip-hop', 'jazz', 'metal', 'electronic'];  // Available genres

$token = getSpotifyToken();  // Get the Spotify token

foreach ($countries as $country) {
    foreach ($genres as $genre) {
        $averagePopularity = fetchGenrePopularity($genre, $country, $token);
        storeDataInDatabase($country, $genre, $averagePopularity);
    }
}

?>