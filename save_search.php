<?php

//Questo file salva le ricerche effettuate nel database

require_once ("login.php");

if (!empty($_POST["search_text"]) || !empty($_POST["search_tag"])) {
    //Faccio l'escape dei dati presi in POST

    $search_text = $_POST["search_text"];
    $search_tag = $_POST["search_tag"];
    $search_timestamp = date("Y-m-d H:i:s");
    // Create connection
    $conn = mysqli_connect($db_hostname, $db_username, $db_password, $db_database);
// Check connection   

    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }

    $sql = "INSERT INTO search (text, tag, timestamp)
VALUES ('$search_text', '$search_tag', '$search_timestamp')";

    mysqli_query($conn, $sql);

    mysqli_close($conn);
}
?>
