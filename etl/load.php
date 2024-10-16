<?php

// Include the configuration file for the database connection
require 'config.php';

header('Content-Type: application/json');

// Establish connection to the database
try {
    $pdo = new PDO($dsn, $user, $password, $options);

    // Retrieve country and genre from the URL and filter
    $country = isset($_GET['country']) ? $_GET['country'] : null;
    $genre = isset($_GET['genre']) ? $_GET['genre'] : null;

    // SQL query with optional WHERE conditions
    $sql = "SELECT country, song, rank, genre FROM music_data WHERE 1=1";
    
    // Add conditions only if values are provided
    if ($country) {
        // Use LIKE for partial matches
        $sql .= " AND country LIKE :country";
    }
    if ($genre) {
        // Use LIKE for partial matches
        $sql .= " AND genre LIKE :genre";
    }

    $stmt = $pdo->prepare($sql);

    // Bind parameters and add wildcards for partial matches
    if ($country) {
        $country = "%" . $country . "%"; // Allow partial match
        $stmt->bindParam(':country', $country, PDO::PARAM_STR);
    }
    if ($genre) {
        $genre = "%" . $genre . "%"; // Allow partial match
        $stmt->bindParam(':genre', $genre, PDO::PARAM_STR);
    }

    // Execute the SQL query
    $stmt->execute();

    // Fetch all results
    $songs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if data was found
    if (count($songs) > 0) {
        // Output the data in JSON format
        echo json_encode($songs, JSON_PRETTY_PRINT);
    } else {
        echo json_encode(["message" => "No song data found."]);
    }

} catch (PDOException $e) {
    // Error message if connection or query fails
    echo json_encode(["error" => "Error connecting to the database: " . $e->getMessage()]);
}

// Close the connection
$pdo=null;

?>