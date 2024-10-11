<?php
include_once 'config.php'; // Include the config.php file

try {
    // PDO-Verbindung herstellen
    $pdo = new PDO($dsn, $user, $password, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Verbindung zur Datenbank erfolgreich hergestellt.<br>";

} catch (PDOException $e) {
    die("Datenbankverbindung fehlgeschlagen: " . $e->getMessage());
}

// Angenommen, die Daten wurden bereits in einem Array $artistDataArray in extract_artists.php erzeugt
$artistDataArray = include 'extract_artists.php'; // Hiermit stellen wir sicher, dass die Daten aus extract_artists.php verfügbar sind
print_r($artistDataArray);

// SQL-Befehl zum Einfügen der Künstlerdaten in die Tabelle
$sql = "INSERT INTO artist_data (country, artist, rank, genre) VALUES (:country, :artist, :rank, :genre)";

$stmt = $pdo->prepare($sql);

// Durchlaufe das Array und füge jeden Künstler in die Datenbank ein
foreach ($artistDataArray as $artistData) {
    try {
        // Daten binden und ausführen
        $stmt->execute([
            ':country' => $artistData['country'],
            ':artist' => $artistData['artist_name'],
            ':rank' => $artistData['rank'],
            ':genre' => $artistData['genre']
        ]);

        echo "Künstler erfolgreich eingefügt: " . $artistData['artist_name'] . " (Land: " . $artistData['country'] . ")<br>";

    } catch (PDOException $e) {
        echo "Fehler beim Einfügen des Künstlers " . $artistData['artist_name'] . ": " . $e->getMessage() . "<br>";
    }
}

echo "Alle Künstler wurden erfolgreich in die Datenbank geladen.";

?>