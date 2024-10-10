<?php

// Datenbankverbindungsparameter
$host = 'o40yx5.myd.infomaniak.com'; 
$dbname = 'o40yx5_im3'; // Datenbankname
$user = 'o40yx5_steve'; // Benutzername (ändern, falls benötigt)
$password = 'n_HMadyaaO5'; // Passwort (ändern, falls benötigt)

// DSN (Datenquellenname) für PDO
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";

// Optionen für PDO
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Aktiviert die Ausnahmebehandlung für Datenbankfehler
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Legt den Standard-Abrufmodus auf assoziatives Array fest
    PDO::ATTR_EMULATE_PREPARES => false, // Deaktiviert die Emulation vorbereiteter Anweisungen, für bessere Leistung
];

?>