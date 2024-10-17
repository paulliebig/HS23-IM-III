<?php
// Include database configuration file
require 'config.php';

header('Content-Type: application/json');

// Establish connection to the database
try {
    $pdo = new PDO($dsn, $user, $password, $options);

    // Retrieve country, genre, and date from the URL and sanitize them
    $country = isset($_GET['country']) ? $_GET['country'] : null;
    $genre = isset($_GET['genre']) ? $_GET['genre'] : null;
    $date = isset($_GET['date']) ? $_GET['date'] : null; // The selected date in format: yyyy-mm-dd

    // Base SQL query
    $sql = "SELECT timestamp, country, song, rank, genre FROM music_data WHERE 1=1";
    
    // Append filters only if values are provided
    if ($country) {
        $sql .= " AND country LIKE :country";
    }
    if ($genre) {
        $sql .= " AND genre LIKE :genre";
    }
    if ($date) {
        $sql .= " AND DATE(timestamp) = :date"; // Filter based on the date
    }

    $stmt = $pdo->prepare($sql);

    // Bind parameters to allow partial matching with wildcards
    if ($country) {
        $country = "%" . $country . "%";
        $stmt->bindParam(':country', $country, PDO::PARAM_STR);
    }
    if ($genre) {
        $genre = "%" . $genre . "%";
        $stmt->bindParam(':genre', $genre, PDO::PARAM_STR);
    }
    if ($date) {
        $stmt->bindParam(':date', $date, PDO::PARAM_STR);
    }

    // Execute SQL query
    $stmt->execute();

    // Fetch all results
    $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if any data was found
    if (count($songs) > 0) {
        echo json_encode($songs, JSON_PRETTY_PRINT);
    } else {
        echo json_encode(["message" => "No song data found."]);
    }

} catch (PDOException $e) {
    echo json_encode(["error" => "Database connection error: " . $e->getMessage()]);
}

// Close the connection
$pdo=null;
?>