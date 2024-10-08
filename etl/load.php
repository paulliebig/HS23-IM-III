<?php

// Datenbankverbindung (PDO)
$host = 'localhost'; im3paul.rigged-motion.com
$dbname = 'music_database'; // Datenbankname
$user = 'root'; // Benutzername (ändern, falls benötigt)
$password = ''; // Passwort (ändern, falls benötigt)

try {
    // PDO-Verbindung herstellen
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Verbindung zur Datenbank erfolgreich hergestellt.<br>";

} catch (PDOException $e) {
    die("Datenbankverbindung fehlgeschlagen: " . $e->getMessage());
}

// Angenommen, die Daten wurden bereits in einem Array $songDataArray in extract.php erzeugt
include 'extract.php'; // Hiermit stellen wir sicher, dass die Daten aus extract.php verfügbar sind

// SQL-Befehl zum Einfügen der Daten in die Tabelle
$sql = "INSERT INTO music_data (country, song, rank, genre) VALUES (:country, :song, :rank, :genre)";

$stmt = $pdo->prepare($sql);

// Durchlaufe das Array und füge jeden Song in die Datenbank ein
foreach ($songDataArray as $songData) {
    try {
        // Daten binden und ausführen
        $stmt->execute([
            ':country' => $songData['country'],
            ':song' => $songData['song_name'],
            ':rank' => $songData['rank'],
            ':genre' => $songData['genre']
        ]);

        echo "Song erfolgreich eingefügt: " . $songData['song_name'] . " (Land: " . $songData['country'] . ")<br>";

    } catch (PDOException $e) {
        echo "Fehler beim Einfügen des Songs " . $songData['song_name'] . ": " . $e->getMessage() . "<br>";
    }
}

echo "Alle Songs wurden erfolgreich in die Datenbank geladen.";

?>