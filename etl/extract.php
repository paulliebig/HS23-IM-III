<?php


function getSpotifyToken() {
    $clientId = '4f74336e66a941a3a7d5285f5e207e66';  // Replace with your client ID
    $clientSecret = '4217d8cc611a4e8bb80638e1b0d1d4c3';  // Replace with your client secret
    
    $url = 'https://accounts.spotify.com/api/token';
    $headers = [
        'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret),
        'Content-Type: application/x-www-form-urlencoded'
    ];
    $postFields = 'grant_type=client_credentials';

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['access_token'];
}

?>
