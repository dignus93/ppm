
<?php

header('Content-Type: text/json');

require_once ("login.php");

//Controllo di aver ricevuto dei dati
if (!empty($_POST["centerLat"])) {
    //Assegno latitudine e longitudine del centro e distanza dal centro alle variabili
    $lat = $_POST["centerLat"];
    $lng = $_POST["centerLng"];
    $distance = $_POST["radius"];
    $quest = $_POST["quest"];
    $tag = $_POST["tag"];

    $da = $_POST["da"];
    $a = $_POST["a"];
    $number = $_POST["number"];

    if ($number == NULL) {
        $number = 100;
    }


    // Create connection
    $conn = mysqli_connect($db_hostname, $db_username, $db_password, $db_database);
    // Check connection   

    if (!$conn) {
        die("Connection failed: " . mysqli_connect_error());
    }


    // Definisco l'url e poi faccio la chiamata alle API di Instagram con i parametri ricevuti  -------------QUI PASSO ACCESS TOKEN DI ISTAGRAM!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    $url = 'https://api.instagram.com/v1/media/search?lat=' . $lat . '&lng=' . $lng . '&distance=' . $distance . '&access_token=2909919418.16bfc37.17ae1c8d0be64e80982269fa5976f331&count=100';  //QUI PASSO ACCESS TOKEN (senza &count=100)

    $jsonData = json_decode((file_get_contents($url)));

    // Preparo l'array in cui metterò i dati che mi interessa mandare indietro al file javascript
    $response = array();


    // Itero sui dati ricevuti e prendo ciò che mi interessa:
    foreach ($jsonData->data as $key => $value) {
        // salvo l'url della foto
        $image_url = $value->images->low_resolution->url;
        // salvo le coordinate delle foto
        $latitude = $value->location->latitude;
        $longitude = $value->location->longitude;
		
        $tags = $value->tags;
        $stringTag = '';
        foreach ($tags as $tagValue) {
            $stringTag.=' ' . $tagValue . ' ';
        }

        $text = $value->comments->data[0]->text;
        $creation_time_temp = $value->created_time;
        // converto il tempo di creazione
        $creation_time = date('  D M d h:i:s Y ', $creation_time_temp);
        $creation_time_db = date('Y-m-d H:i:s  ', $creation_time_temp);
        //L'id è relativo alla foto
        $id = $value->id;
        $profile_picture_url = $value->user->profile_picture;
        $username = $value->user->full_name;


        $sql = "INSERT INTO instagram (id, creation_time, latitude, longitude, text, tags, username, profile_picture_url, image_url )
        VALUES ('$id', '$creation_time_db', '$latitude', '$longitude', '$text', '$stringTag', '$username', '$profile_picture_url', '$image_url')";

        mysqli_query($conn, $sql);
    }

    if ($tag != NULL) {



        if ($da != NULL && $a != NULL) {
            $da = date('Y-m-d H:i:s  ', strtotime($da));
            $a = date('Y-m-d H:i:s  ', strtotime($a));

            if ($lat != NULL && $lng != NULL && $distance != NULL) {
                $sql = "SELECT id, creation_time, latitude, longitude, text, tags, username, profile_picture_url, image_url AS url, ( 3959 *                   acos( cos(                   radians($lat) )         * cos( radians( latitude ) )
            * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
            FROM instagram
            WHERE text LIKE '%$quest%'    AND tags LIKE '% $tag %' AND creation_time BETWEEN '$da' AND '$a'
            HAVING (distance * 1000) < $distance
            ORDER BY creation_time DESC
            LIMIT $number";
            }
        } else {
            if ($lat != NULL && $lng != NULL && $distance != NULL) {
                $sql = "SELECT id, creation_time, latitude, longitude, text, tags, username, profile_picture_url, image_url AS url, ( 3959 *                 acos( cos(                   radians($lat) )         * cos( radians( latitude ) )
            * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
            FROM instagram
            WHERE text LIKE '%$quest%'    AND tags LIKE '% $tag %'
            HAVING (distance * 1000) < $distance
            ORDER BY creation_time DESC
            LIMIT $number";
            }
        }
    } else {

        if ($da != NULL && $a != NULL) {
            $da = date('Y-m-d H:i:s  ', strtotime($da));
            $a = date('Y-m-d H:i:s  ', strtotime($a));

            if ($lat != NULL && $lng != NULL && $distance != NULL) {
                $sql = "SELECT id, creation_time, latitude, longitude, text, tags, username, profile_picture_url, image_url AS url, ( 3959 * acos( cos(                   radians($lat) )         * cos( radians( latitude ) )
        * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
        FROM instagram
        WHERE text LIKE '%$quest%' AND tags LIKE '%$tag%' AND creation_time BETWEEN '$da' AND '$a'
        HAVING (distance * 1000) < $distance
        ORDER BY creation_time DESC
        LIMIT $number";
            }
        } else {
            if ($lat != NULL && $lng != NULL && $distance != NULL) {
                $sql = "SELECT id, creation_time, latitude, longitude, text, tags, username, profile_picture_url, image_url AS url, ( 3959 * acos( cos(                   radians($lat) )         * cos( radians( latitude ) )
        * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
        FROM instagram
        WHERE text LIKE '%$quest%' AND tags LIKE '%$tag%'
        HAVING (distance * 1000) < $distance
        ORDER BY creation_time DESC
        LIMIT $number";
            }
        }
    }






    $result = mysqli_query($conn, $sql);

    while ($row = mysqli_fetch_assoc($result)) {
        array_push($response, $row);
    }



    mysqli_close($conn);

    // Codifico i dati in json e li mando indietro al file javascript    
    echo json_encode($response);
}
?>















