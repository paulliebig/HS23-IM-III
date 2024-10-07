<?php

function storeDataInDatabase($country, $genre, $averagePopularity) {
    // Database connection details
    $host = 'localhost';
    $db = 'spotify_data';
    $user = 'your_username';
    $pass = 'your_password';

    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $conn->prepare('INSERT INTO genre_popularity (country, genre, average_popularity, date_collected) VALUES (:country, :genre, :popularity, NOW())');
    $stmt->execute([
        'country' => $country,
        'genre' => $genre,
        'popularity' => $averagePopularity
    ]);
}

?>