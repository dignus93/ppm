<?php

require_once('TwitterAPIExchange.php');

require_once ("login.php");

# creo la variabile delle chiavi di accesso a twitter //QUI PASSO LE CHIAVI---------------------------------!!!!!!!!!!!!!!!!!!!!!!!!!!!!
$settings = array(
    'oauth_access_token' => "846290143904514048-JXtMnGtE03Xw9o0x1XApjuPZLpxnJAa",
    'oauth_access_token_secret' => "USKFCPTjZOF4AsCAK5kS98mvKlebkiaxbnKAAg7UnnXAP",
    'consumer_key' => "DC0sePOBbQ8bYdC8r4Smg",
    'consumer_secret' => "q0dwXac1zOyW4ZYdVN8aXjBH8JQHTi0hsO8mkNM5mWdR2yt2ku"
);



$conn = mysqli_connect($db_hostname, $db_username, $db_password, $db_database);
// Check connection   

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

# è la url per una richiesta rest a twitter
$url = "https://api.twitter.com/1.1/search/tweets.json";

#metodo di richiesta
$requestMethod = "GET";

$quest = $_GET['quest'];
$lat = $_GET["centerLat"];
$lng = $_GET["centerLng"];
$distance = $_GET["radius"];
$tags = $_GET["tag"];

$da = $_GET["da"];
$a = $_GET["a"];
$number = $_GET["number"];

if ($number == NULL) {
    $number = 100;
}

$getfield = "?q=";

if ($quest != NULL) {
    $getfield = $getfield . $quest;
}

if ($tags != NULL && $quest == NULL) {
    $getfield = $getfield . "#$tags";
}

if ($tags != NULL && $quest != NULL) {
    $getfield = $getfield . "%2BAND%2B%23$tags";
}

if ($lat != NULL && $lng != NULL && $distance != NULL) {
    $distance = $distance / 1000;
    $getfield = $getfield . "&geocode=$lat,$lng,$distance" . "km";
} else {
    $getfield = $getfield . "&geocode=43.773,11.256,10mi";
}

$getfield = $getfield . "&count=100";


# variabile con autorizzazione di accesso
$twitter = new TwitterAPIExchange($settings);

# ritorna un json, i tre metodi sono per effettuare la richiesta REST
 $twitter->setGetfield($getfield)
        ->buildOauth($url, $requestMethod)
        ->performRequest();

$jsonData = json_decode($tweet);

// Preparo l'array in cui metterò i dati che mi interessa mandare indietro al file javascript
$response = array();

// Itero sui dati ricevuti e prendo ciò che mi interessa:
foreach ($jsonData->statuses as $key => $value) {
    $id = $value->id;
    $latitude = $value->coordinates->coordinates[1];
    $longitude = $value->coordinates->coordinates[0];
    $text = $value->text;
    $username = $value->user->name;
    $profile_picture_url = $value->user->profile_image_url;
    $creation_time = date('Y-m-d H:i:s  ', strtotime($value->created_at));
    foreach ($value->entities->hashtags as $key => $tag) {
        $hashtags .= "$tag->text, ";
    }

    $sql = "INSERT INTO twitter (id, creation_time, latitude, longitude, text, hashtags, username, profile_picture_url) VALUES ('$id', '$creation_time', '$latitude', '$longitude', '$text', '$hashtags', '$username', '$profile_picture_url')";

    mysqli_query($conn, $sql);
}

if ($da != NULL && $a != NULL) {
    $da = date('Y-m-d H:i:s  ', strtotime($da));
    $a = date('Y-m-d H:i:s  ', strtotime($a));
    
    if ($lat != NULL && $lng != NULL && $distance != NULL) {
        $sql = "SELECT id, creation_time, latitude, longitude, text, hashtags, username, profile_picture_url, ( 3959 * acos( cos( radians($lat) ) * cos( radians( latitude ) )
    * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
    FROM twitter
    WHERE text LIKE '% $quest %' AND hashtags LIKE '%$tags%'AND creation_time BETWEEN '$da' AND '$a'
    HAVING distance < $distance
    ORDER BY creation_time  DESC
    LIMIT $number";
    }
} else {
    if ($lat != NULL && $lng != NULL && $distance != NULL) {
        $sql = "SELECT id, creation_time, latitude, longitude, text, hashtags, username, profile_picture_url, ( 3959 * acos( cos( radians($lat) ) * cos( radians( latitude ) )
    * cos( radians( longitude ) - radians($lng) ) + sin( radians($lat) ) * sin(radians(latitude)) ) ) AS distance
    FROM twitter
    WHERE text LIKE '% $quest %' AND hashtags LIKE '%$tags%'
    HAVING distance < $distance
    ORDER BY creation_time DESC
    LIMIT $number";
    }
}


$result = mysqli_query($conn, $sql);

while ($row = mysqli_fetch_assoc($result)) {
    array_push($response, $row);
}

mysqli_close($conn);

// Codifico i dati in json e li mando indietro al file javascript    
echo json_encode($response);
?>