<?php

// Einbinden der Konfigurationsdatei für die Datenbankverbindung
require 'config.php';

header('Content-Type: application/json');

// Verbindung zur Datenbank herstellen
try {
    $pdo = new PDO($dsn, $user, $password, $options);

    // Country und Genre aus der URL abrufen und filtern
    $country = isset($_GET['country']) ? $_GET['country'] : null;
    $genre = isset($_GET['genre']) ? $_GET['genre'] : null;

    // SQL-Anweisung mit optionalen WHERE-Bedingungen
    $sql = "SELECT timestamp, country, artist, rank, genre FROM artists WHERE 1=1";
    
    // Bedingungen nur hinzufügen, wenn Werte vorhanden sind
    if ($country) {
        // Verwenden Sie LIKE für Teilübereinstimmungen
        $sql .= " AND country LIKE :country";
    }
    if ($genre) {
        // Verwenden Sie LIKE für Teilübereinstimmungen
        $sql .= " AND genre LIKE :genre";
    }

    $stmt = $pdo->prepare($sql);

    // Parameter binden und Wildcards für Teilübereinstimmungen hinzufügen
    if ($country) {
        $country = "%" . $country . "%"; // Teilübereinstimmung ermöglichen
        $stmt->bindParam(':country', $country, PDO::PARAM_STR);
    }
    if ($genre) {
        $genre = "%" . $genre . "%"; // Teilübereinstimmung ermöglichen
        $stmt->bindParam(':genre', $genre, PDO::PARAM_STR);
    }

    // SQL-Anweisung ausführen
    $stmt->execute();

    // Alle Ergebnisse abrufen
    $artists = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Überprüfen, ob Daten gefunden wurden
    if (count($artists) > 0) {
        // Die Daten im JSON-Format ausgeben
        echo json_encode($artists, JSON_PRETTY_PRINT);
    } else {
        echo json_encode(["message" => "Keine Künstlerdaten gefunden."]);
    }

} catch (PDOException $e) {
    // Fehlermeldung, falls die Verbindung oder der Abruf fehlschlägt
    echo json_encode(["error" => "Fehler bei der Verbindung zur Datenbank: " . $e->getMessage()]);
}

// Verbindung schließen
$pdo = null;

?>
