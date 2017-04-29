var map;
var tweet_markers = L.layerGroup();
var image_markers = L.layerGroup();
var gridMarkers = [];
var filtered = [];
var isFiltered = false;

//variabili per poligono
var points = [];
var latitudes = [];
var longitudes = [];
var shape = null;
var centerLat;
var centerLng;
var maxRadius;

//variabili per richieste ajax a twitter e instagram
var tweetData = 0;
var imageData = 0;
var quest = null;
var tag = null;
var da = "Invalid Date";
var a = "Invalid Date";
var number = 100;
var dadate;
var adate;

//variabili per la timeline
var containerTweet = null;
var svgTweet = null;
var contextTweet = null;
var xAxisTweet = null;
var containerImage = null;
var svgImage = null;
var contextImage = null;
var xAxisImage = null;

//Per la città selezionata. Di default è florence
var city = 'florence';

//variabili di geolocalizzazione dell'utente
var currentLocationLatitude;
var currentLocationLongitude;

var insta_icon = L.icon({
    iconUrl: 'images/insta_icon.png',
    iconSize: [32, 32],
    iconAnchor: [11, 32],
    popupAnchor: [6, -35]
});

var tweet_icon = L.icon({
    iconUrl: 'images/twitter_icon.png',
    iconSize: [32, 32],
    iconAnchor: [11, 32],
    popupAnchor: [6, -35]
});

var selected_icon = L.icon({
    iconUrl: 'images/selected_icon.png',
    iconSize: [32, 32],
    iconAnchor: [11, 32],
    popupAnchor: [6, -35]
});

//variabili per sapere che tipo di browser viene utilizzato
var opera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var firefox = typeof InstallTrigger !== 'undefined';
var chrome = !!window.chrome && !opera;

jQuery(document).ready(function () {

    //ottiene geolocalizzazione
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(GetLocation, errorEvent);
    }

    map = L.map('map').setView([43.773, 11.256], 17);
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {attribution: osmAttrib});
    map.addLayer(osm);

    //controlli per disegnare poligono
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    var drawControlFull = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            remove: false,
            edit: false
        },
        draw: {
            polygon: {
                shapeOptions: {
                    color: 'purple'
                },
                allowIntersection: false,
                drawError: {
                    color: 'orange',
                    timeout: 1000
                }
            },
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false
        }
    });

    map.addControl(drawControlFull);

    // creo il tasto per eliminare il poligono creato
    L.Control.RemoveAll = L.Control.extend({
        options: {
            position: 'topleft',
        },
        onAdd: function (map) {
            var controlDiv = L.DomUtil.create('div', 'leaflet-control-remove-all');
            L.DomEvent
                    .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                    .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                    .addListener(controlDiv, 'click', function () {
                        //quando viene cliccato il cestino: metto i valori a null per poter effettuare le chiamate senza poligono
                        //aggiunge il controllo per il poligono, cancella il cestino e effettua le chiamate ajax
                        centerLat = null;
                        centerLng = null;
                        maxRadius = null;
                        deleteMarkers();
                        drawnItems.clearLayers();
                        drawControlFull.addTo(map);
                        removeAllControl.removeFrom(map);
                        shape = null;
                        $.when(getDataTwitter().done(function (data) {
                            tweetData = data;
                            addTweettoMap(tweetData);
                        }), getDataInstagram().done(function (data) {
                            imageData = data;
                            addImagestoMap(imageData);
                        })).then(function () {
                            setBrushImage(imageData);
                            setBrushTweet(tweetData);
                            isFiltered = false;
                            filtered = imageData;
                        });
                    });

            var controlUI = L.DomUtil.create('div', 'leaflet-control-remove-all-interior', controlDiv);
            controlUI.title = 'Remove Polygon';
            return controlDiv;
        }
    });

    //creo la variabile del tasto
    var removeAllControl = new L.Control.RemoveAll();


    //funzione chiamata quando viene creato il poligono
    map.on('draw:created', function (e) {

        //variabile del poligono
        layer = e.layer;

        // coordinate dei punti del poligono in json
        shape = layer.toGeoJSON();

        //calcola il centro e il raggio del poligono, per semplificare il codice
        calculatePolygonCoordinate(shape);

        //centra la mappa nel centro del poligono
        map.panTo([centerLat, centerLng], 17);

        //cancella i vecchi marker per poi aggiungerli con la chiamata ajax
        deleteMarkers();

        $.when(getDataTwitter(centerLat, centerLng, maxRadius).done(function (data) {
            tweetData = data;
            addTweettoMap(tweetData);
        }), getDataInstagram(centerLat, centerLng, maxRadius).done(function (data) {
            imageData = data;
            addImagestoMap(imageData);
        })).then(function () {
            setBrushImage(imageData);
            setBrushTweet(tweetData);

        });

        //aggiunge il cestino
        layer.addTo(drawnItems);
        drawControlFull.removeFrom(map);
        map.addControl(removeAllControl);
        drawnItems.addLayer(layer);
        isFiltered = false;
    });

    $('form').on('submit', function (e) {
        e.preventDefault();
        deleteMarkers();
        quest = document.getElementById("text-search").value;
        tag = document.getElementById("hashtag-search").value;

        dadate = $("#from").val().replace(/-/g, "/");
        da = new Date(dadate);

        adate = $("#to").val().replace(/-/g, "/");
        a = new Date(adate);

        number = document.getElementById("number").value;

        //salva la ricerca
        saveSearch();

        // Prende la città selezionata
        city = $('input[name=city]:checked').val();

        if (shape == null) {
            var cityCenter = getSelectedCityCenter();
            map.panTo([cityCenter["latitude"], cityCenter["longitude"]], 17);
        }

        $.when(getDataTwitter(centerLat, centerLng, maxRadius).done(function (data) {
            tweetData = data;
            addTweettoMap(tweetData);
        }), getDataInstagram(centerLat, centerLng, maxRadius).done(function (data) {
            imageData = data;
            addImagestoMap(imageData);
        })).then(function () {
            setBrushImage(imageData);
            setBrushTweet(tweetData);
        });
    });



    //aspetta che le due chiamate siano state fatte prima di chiamare setBrush, cioè crearela timeline
    $.when(getDataTwitter().done(function (data) {
        tweetData = data;
        addTweettoMap(tweetData);
    }), getDataInstagram().done(function (data) {
        imageData = data;
        addImagestoMap(imageData);
    })).then(function () {
        setBrushImage(imageData);
        setBrushTweet(tweetData);
    });

});


//::::::::::::::::   funzioni secondarie    :::::::::


function deleteMarkers() {
    tweet_markers.clearLayers();
    image_markers.clearLayers();
}

//funzione che effettua la chiamata ajax, serve per disaccoppiare le chiamata a funzione
function getDataTwitter() {

    // Se nessun poligono è specificato cerca le foto nel centro della città selezionata
    if (!testValue(centerLat) || !testValue(centerLng) || !testValue(maxRadius)) {
        var cityCenter = getSelectedCityCenter();
        return $.ajax({
            url: 'twitter.php',
            type: 'GET',
            data: {'da': dadate, 'a': adate, 'number': number, 'quest': quest, 'tag': tag, 'centerLat': cityCenter["latitude"], 'centerLng': cityCenter["longitude"], 'radius': 5000},
            dataType: "json"
        });
    } else {
        return $.ajax({
            url: 'twitter.php',         //QUI USA TWITTER.PHP <------------------------------------------------
            type: "GET",
            data: {'da': dadate, 'a': adate, 'number': number, 'quest': quest, 'tag': tag, 'centerLat': centerLat, 'centerLng': centerLng, 'radius': maxRadius},
            dataType: "json"
        });
    }
}

//idem per Instagram
function getDataInstagram(centerLat, centerLng, maxRadius) {
    // Se nessun poligono è specificato cerca le foto nel centro della città selezionata
    if (!testValue(centerLat) || !testValue(centerLng) || !testValue(maxRadius)) {
        var cityCenter = getSelectedCityCenter();
        return $.ajax({
            url: 'instagram.php',
            type: 'post',
            data: {'da': dadate, 'a': adate, 'number': number, 'quest': quest, 'tag': tag, 'centerLat': cityCenter["latitude"], 'centerLng': cityCenter["longitude"], 'radius': 5000},
            dataType: "json"
        });
    }
    //Altrimenti le cerca all'interno del poligono
    else {
        return $.ajax({
            url: 'instagram.php',
            type: 'post',
            data: {'da': dadate, 'a': adate, 'number': number, 'quest': quest, 'tag': tag, 'centerLat': centerLat, 'centerLng': centerLng, 'radius': maxRadius},
            dataType: "json"
        });

    }

}

function saveSearch() {
    $.ajax({
        url: 'save_search.php',
        type: 'post',
        data: {'search_text': quest, 'search_tag': tag}
    });

}

// funzione che restituisce il max elemento dell'array    
function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

//aggiunge tweet alla mappa
function addTweettoMap(data) {

    var tweet = data;

    $.each(tweet, function () {

        //seleziona solo quelli con geolocalizzazione
        if (this.latitude != null) {

            var tweet_point = L.latLng(this.latitude, this.longitude);

            if (centerLat != null && centerLng != null && maxRadius != null) {
                if (pointInPolygon(tweet_point, latitudes, longitudes)) {
                    addTweetMarker(this, tweet_point);
                }
            } else {
                addTweetMarker(this, tweet_point);
            }
        }
    });

    //itera su ogni tweet contenuto in statuses

    tweet_markers.addTo(map);
}

//aggiunge il marker al tweet
function addTweetMarker(data, marker) {
    var marker_tweet = L.marker(marker, {icon: tweet_icon}).on('mouseout', function (e) {
        e.target.setIcon(tweet_icon);
        this.closePopup();
        //seleziona il cerchio riferito al tweet con stesso id
        var circle = $("#" + data.id);
        circle.stop().animate({r: 5}, 500);
        circle.attr("fill", "blue");
        circle.attr("opacity", 0.5);
        if (!chrome || !opera) {
            circle.attr("r", 5);
        }
    }).on('mouseover', function (e) {
        e.target.setIcon(selected_icon);
        this.openPopup();
        var circle = $("#" + data.id);
        circle.stop().animate({r: 10}, 500);
        circle.attr("fill", "red");
        circle.attr("opacity", 1);
        if (!chrome || !opera) {
            circle.attr("r", 10);
        }
    }).on('click', function (e) {

        map.panTo(e.latlng, 17);
        e.target.setIcon(selected_icon);
        var circle = document.getElementById(data.id);
        circle.setAttribute("fill", "green");
        circle.setAttribute("opacity", 1);

        //seleziona il div
        var description = document.getElementById("item-selected-description");
        description.setAttribute("background-color", "#000000");

        //elimina il contenuto precedente
        while (description.hasChildNodes()) {
            description.removeChild(description.lastChild);
        }

        // aggiunge i dati dell'utente
        var user_photo = document.createElement('div');
        user_photo.setAttribute('id', "user_photo");
        user_photo.innerHTML = "<img src='" + data.profile_picture_url + "'>";

        var username = document.createElement('div');
        username.setAttribute('id', "username");
        username.innerHTML = "<h4>" + data.username + "</h4>";

        var text_element = document.createElement('div');
        text_element.setAttribute('id', "text_element");
        text_element.innerHTML = "<p>" + data.text + "</p>";

        var hashtag_element = document.createElement('div');
        hashtag_element.setAttribute('id', "hashtag_element");
        hashtag_element.innerHTML = "<p>" + data.hashtags + "</p>";

        var creation_element = document.createElement('div');
        creation_element.setAttribute('id', "creation_element");
        creation_element.innerHTML = "<p>Uploaded on: " + data.creation_time + "</p>";

        //aggiunge tutto al div
        description.appendChild(user_photo);
        description.appendChild(username);
        description.appendChild(text_element);
        description.appendChild(hashtag_element);
        description.appendChild(creation_element);

    });
    if (data.text != null) {
        marker_tweet.bindPopup(data.text, {className: 'twitter-popup'});
    }
    tweet_markers.addLayer(marker_tweet);
}


//aggiunge immagini
function addImagestoMap(data) {

    //filtra i dati, lasciando solo quelli dentro il poligono
    if (shape != null) {
        filterPolygon = function (d) {
            var marker = L.latLng(d.latitude, d.longitude);
            if (pointInPolygon(marker, latitudes, longitudes)) {
                return true;
            }
        };
        data = data.filter(filterPolygon);
    }

    $.each(data, function (i) {

        var marker = L.latLng(this.latitude, this.longitude);

        if (testValue(centerLat) && testValue(centerLng) && testValue(maxRadius)) {
            if (pointInPolygon(marker, latitudes, longitudes)) {
                addInstaMarker(this, marker, i);
            }
        } else {
            addInstaMarker(this, marker, i);
        }

    });

    image_markers.addTo(map);
    addImagesToGrid(0, false, data);
}


function calculatePolygonCoordinate(shape) {
    //resetto prima del calcolo tutti i valori a zero;
    points = [];
    latitudes = [];
    longitudes = [];
    centerLat = 0;
    centerLng = 0;
    maxRadius = 0;

    for (i = 0; i < shape.geometry.coordinates[0].length - 1; i++) {
        latitudes.push(shape.geometry.coordinates[0][i][1]);
        longitudes.push(shape.geometry.coordinates[0][i][0]);
        points.push(L.latLng(latitudes[i], longitudes[i]));
        centerLat += points[i].lat;
        centerLng += points[i].lng;
    }

    centerLat = centerLat / latitudes.length;
    centerLng = centerLng / longitudes.length;

    var center = L.latLng(centerLat, centerLng);

    var radius = [];
    for (i = 0; i < points.length; i++) {
        radius[i] = center.distanceTo(points[i]);
    }

    maxRadius = getMaxOfArray(radius);
}


function pointInPolygon(point, latitudes, longitudes) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var x = point.lat, y = point.lng;
    var inside = false;
    for (var i = 0, j = latitudes.length - 1; i < latitudes.length; j = i++) {
        var xi = latitudes[i], yi = longitudes[i];
        var xj = latitudes[j], yj = longitudes[j];
        var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}


function addInstaMarker(data, marker, i) {
    var insta_marker = L.marker(marker, {icon: insta_icon}).bindPopup("<img src=" + data.url + "\>", {className: 'instagram-popup', closeButton: false}).on('mouseout', function (e) {
        e.target.setIcon(insta_icon);
        this.closePopup();

        var circle = $("#" + data.id);
        circle.stop().animate({r: 5}, 500);
        circle.attr("fill", "yellow");
        circle.attr("opacity", 1);
        if (!chrome || !opera) {
            circle.attr("r", 5);
        }
    }).on('mouseover', function (e) {
        e.target.setIcon(selected_icon);
        this.openPopup();

        var circle = $("#" + data.id);
        circle.stop().animate({r: 10}, 500);
        circle.attr("fill", "red");
        circle.attr("opacity", 1);
        if (!chrome || !opera) {
            circle.attr("r", 10);
        }

    }).on('click', function (e) {

        map.panTo(e.latlng, 17);

        //filtra i dati per aggiungerli alla griglia se nn sono stati filtrati e se c'è il poligono
        if (shape != null && isFiltered == false) {
            filtered = filterData(imageData);
        }

        if (filtered.length == 0 && shape == null) {
            addImagesToGrid(i, true, imageData);
        } else {
            addImagesToGrid(i, true, filtered);
        }

        e.target.setIcon(selected_icon);
        var circle = document.getElementById(data.id);
        circle.setAttribute("fill", "green");
        circle.setAttribute("opacity", 1);

        //seleziona il div
        var description = document.getElementById("item-selected-description");
        description.setAttribute("background-color", "#000000");

        //elimina il contenuto precedente
        while (description.hasChildNodes()) {
            description.removeChild(description.lastChild);
        }

        // aggiunge i dati dell'utente
        var user_photo = document.createElement('div');
        user_photo.setAttribute('id', "user_photo");
        user_photo.innerHTML = "<img src='" + data.profile_picture_url + "'>";

        var username = document.createElement('div');
        username.setAttribute('id', "username");
        username.innerHTML = "<h4>" + data.username + "</h4>";

        var image_element = document.createElement('div');
        image_element.setAttribute('id', "image_element");
        image_element.innerHTML = "<img src='" + data.url + "'>";

        var hashtag_element = document.createElement('div');
        hashtag_element.setAttribute('id', "hashtag_element");
        hashtag_element.innerHTML = "<p>" + data.tags + "</p>";

        var creation_element = document.createElement('div');
        creation_element.setAttribute('id', "creation_element");
        creation_element.innerHTML = "<p>Uploaded on: " + data.creation_time + "</p>";

        //aggiunge tutto al div
        description.appendChild(user_photo);
        description.appendChild(username);
        description.appendChild(image_element);
        description.appendChild(hashtag_element);
        description.appendChild(creation_element);

    });

    //aggiunge dati extra al marker
    insta_marker.profile_picture_url = data.profile_picture_url;
    insta_marker.username = data.username;
    insta_marker.url = data.url;
    insta_marker.tags = data.tags;
    insta_marker.creation_time = data.creation_time;

    image_markers.addLayer(insta_marker);

}

// Devo controllare se il valore è una stringa vuota o null
function testValue(test) {
    if (test == null || test == "")
        return false;
    else
        return true;
}

//setta la timeline in base ai dati passati
function setBrushTweet(data) {

    //filtra i dati se c'è un poligono'
    if (shape != null) {
        filterPolygon = function (d) {
            var marker = L.latLng(d.latitude, d.longitude);
            if (pointInPolygon(marker, latitudes, longitudes)) {
                return true;
            }
        };

        data = data.filter(filterPolygon);
    }

    if (contextTweet !== null) {
        contextTweet.selectAll("*").remove();
    }

    if (containerTweet === null) {
        containerTweet = d3.select('#brush'),
                width = containerTweet.node().offsetWidth,
                height = containerTweet.node().offsetHeight / 2,
                margin = {top: 0, right: 0, bottom: 0, left: 0};
    }

    //crea array di date per settare l'asse del tempo
    var dateArray = new Array();
    $.each(data, function () {
        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = this.creation_time.split(/[- :]/);
        var d = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
        dateArray.push(d);
        this.creation_time = d;
    });

    //prende il massimo e il mino dell'array di date
    var timeExtent = d3.extent(dateArray);

    if (svgTweet === null) {
        svgTweet = containerTweet.append('svg')
                .attr('width', width + margin.left + margin.right - 5)
                .attr('height', height + margin.top + margin.bottom - 5);
    }

    if (contextTweet === null) {
        contextTweet = svgTweet.append('g')
                .attr('class', 'context')
                .attr('transform', 'translate(' +
                        margin.left + ',' +
                        margin.top + ')');
    }

    //trasforma un intervallo di tempi in un segmento spaziale
    var x = d3.time.scale()
            .range([0, width])
            .domain(timeExtent);

    //variabile per filtrare sulla timeline
    var brush = d3.svg.brush()
            .x(x)
            .on('brushend', brushend);

    //prende i dati, li aggiunge, aggiunge un circle(immagine svg), attribuisce valori al cerchio(id, posizione,raggio...)
    contextTweet.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr("id", function (d) {
                return d.id;
            })
            .attr('transform', function (d) {
                return 'translate(' + [x(new Date(d.creation_time)), height / 2] + ')';
            })
            .attr('r', 5)
            .attr('opacity', 0.5)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .attr('fill', 'blue');

    //crea il rettangolo per filtrare
    contextTweet.append('g')
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('rect')
            .attr('y', -6)
            .attr('height', height);


    //xAxsisTweet serve per avere le date sulla timeline
    if (xAxisTweet !== null) {
        xAxisTweet.selectAll("*").remove();
    }

    xAxisTweet = svgTweet.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height / 3 + ")");

    //variabile con estremi temporali
    var extremeLine = [];
    if (data.length > 1) {
        extremeLine.push(data[0].creation_time);
        extremeLine.push(data[data.length - 1].creation_time);
    }

    //aggiunge il testo all'asse x
    xAxisTweet.selectAll("text").data(extremeLine)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr('transform', function (d) {
                if (d == extremeLine[0]) {
                    return 'translate(' + [x(new Date(d)) - 90, height / 3 + 10] + ')';

                } else {
                    return 'translate(' + [x(new Date(d)), height / 3 + 10] + ')';
                }
            })
            .text(function (d) {
                return d.toDateString();
            });

    //filtra i dati in base alla selezione sulla rimeline
    function brushend() {
        var filter;
        if (brush.empty()) {
            filter = function () {
                return true;
            };
        } else {
            filter = function (d) {
                return d.creation_time > +brush.extent()[0] &&
                        d.creation_time < (+brush.extent()[1]);
            };
        }
        var filtered = data.filter(filter);
        tweet_markers.clearLayers();
        addTweettoMap(filtered);
    }
}

function filterData(data) {


    if (shape != null) {
        filterPolygon = function (d) {
            var marker = L.latLng(d.latitude, d.longitude);
            if (pointInPolygon(marker, latitudes, longitudes)) {
                return true;
            }
        };

        data = data.filter(filterPolygon);
        return data;
    } else
        return data;

}

function setBrushImage(data) {


    if (shape != null) {
        filterPolygon = function (d) {
            var marker = L.latLng(d.latitude, d.longitude);
            if (pointInPolygon(marker, latitudes, longitudes)) {
                return true;
            }
        };
        data = data.filter(filterPolygon);
    }


    if (contextImage !== null) {
        contextImage.selectAll("*").remove();
    }

    if (containerImage === null) {
        containerImage = d3.select('#brush'),
                width = containerImage.node().offsetWidth,
                height = containerImage.node().offsetHeight / 2,
                margin = {top: 0, right: 0, bottom: 0, left: 0};
    }

    var dateArray = new Array();
    $.each(data, function () {
        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = this.creation_time.split(/[- :]/);
        var d = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
        dateArray.push(d);
        this.creation_time = d;
    });


    var timeExtent = d3.extent(dateArray);

    if (svgImage === null) {
        svgImage = containerImage.append('svg')
                .attr('width', width + margin.left + margin.right - 5)
                .attr('height', height + margin.top + margin.bottom - 5);
    }

    if (contextImage === null) {
        contextImage = svgImage.append('g')
                .attr('class', 'context')
                .attr('transform', 'translate(' +
                        margin.left + ',' +
                        margin.top + ')');
    }

    var x = d3.time.scale()
            .range([0, width])
            .domain(timeExtent);


    var brush = d3.svg.brush()
            .x(x)
            .on('brushend', brushend);


    contextImage.selectAll('circle')
            .data(data)
            .enter()
            .append('circle').attr("id", function (d) {
        return d.id;
    })
            .attr('transform', function (d) {
                return 'translate(' + [x(new Date(d.creation_time)), height / 2] + ')';
            })
            .attr('r', 5)
            .attr('opacity', 0.5)
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5)
            .attr('fill', 'yellow');

    contextImage.append('g')
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('rect')
            .attr('y', -6)
            .attr('height', height);

    if (xAxisImage !== null) {
        xAxisImage.selectAll("*").remove();
    }

    xAxisImage = svgImage.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height / 3 + ")");

    var extremeLine = [];
    if (data.length > 1) {
        extremeLine.push(data[0].creation_time);
        extremeLine.push(data[data.length - 1].creation_time);
    }

    xAxisImage.selectAll("text").data(extremeLine)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr('transform', function (d) {
                if (d == extremeLine[0]) {
                    return 'translate(' + [x(new Date(d)) - 90, height / 3 + 10] + ')';

                } else {
                    return 'translate(' + [x(new Date(d)), height / 3 + 10] + ')';
                }
            })
            .text(function (d) {
                return d.toDateString();
            });


    function brushend() {
        var filter;
        if (brush.empty()) {
            isFiltered = false;
            filter = function () {
                return true;
            };
        } else {
            filter = function (d) {
                return d.creation_time > +brush.extent()[0] &&
                        d.creation_time < (+brush.extent()[1]);
            };
        }
        filtered = [];
        filtered = data.filter(filter);
        isFiltered = true;
        image_markers.clearLayers();
        addImagestoMap(filtered);
    }
}


function getSelectedCityCenter() {

    if (city === 'florence') {

        var cityCenter = {latitude: 43.773093, longitude: 11.255363};
    } else if (city === 'venice') {

        var cityCenter = {latitude: 45.434214, longitude: 12.338211};
    } else if (city === 'rome') {
        var cityCenter = {latitude: 41.895449, longitude: 12.472325};
    } else {
        var cityCenter = {latitude: currentLocationLatitude, longitude: currentLocationLongitude};
    }
    return cityCenter;
}


function addImagesToGrid(i, bool, data) {

    // array di marker relativi alle foto della griglia
    gridMarkers = [];


    for (var j = 0; j < 9; j++) {
        var id = '#photo' + j;

        var marker = image_markers.getLayers()[i];

        while (typeof marker === 'undefined' && image_markers.getLayers().length != 0) {
            i = (i + 1) % (data.length);
            marker = image_markers.getLayers()[i];
        }
        // Aggiungo nella griglia solo immagini relative a marker presenti nella mappa
        if (data.length > j) {
            $(id).css("opacity", "");
            $(id).attr("src", data[i].url);
            gridMarkers.push(marker);
        } else {
            //rende bianche le caselle quando sono meno di 9 immagini
            $(id).css("opacity", "0");
        }
        i = (i + 1) % (data.length);
    }

    //evento click sulla classe
    $('.image_grid').click(function (e) {

        var photoId = $(e.target).attr('id');
        for (var j = 0; j < 9; j++) {
            var id = 'photo' + j;
            //trovo l'immagine cliccata fra le 9
            if (id == photoId)
            {
                var marker = gridMarkers[j];
                marker.setIcon(selected_icon);
                map.panTo(marker.getLatLng(), 17);

                //seleziona il div per la descrizione
                var description = document.getElementById("item-selected-description");
                description.setAttribute("background-color", "#000000");

                //elimina il contenuto precedente
                while (description.hasChildNodes()) {
                    description.removeChild(description.lastChild);
                }

                // aggiunge i dati dell'utente
                var user_photo = document.createElement('div');
                user_photo.setAttribute('id', "user_photo");
                user_photo.innerHTML = "<img src='" + marker.profile_picture_url + "'>";

                var username = document.createElement('div');
                username.setAttribute('id', "username");
                username.innerHTML = "<h4>" + marker.username + "</h4>";

                var image_element = document.createElement('div');
                image_element.setAttribute('id', "image_element");
                image_element.innerHTML = "<img src='" + marker.url + "'>";

                var hashtag_element = document.createElement('div');
                hashtag_element.setAttribute('id', "hashtag_element");
                hashtag_element.innerHTML = "<p>" + marker.tags + "</p>";

                var creation_element = document.createElement('div');
                creation_element.setAttribute('id', "creation_element");
                creation_element.innerHTML = "<p>" + marker.creation_time + "</p>";

                //aggiunge tutto al div description
                description.appendChild(user_photo);
                description.appendChild(username);
                description.appendChild(image_element);
                description.appendChild(hashtag_element);
                description.appendChild(creation_element);
            }
        }
    });
    // Serve per evidenziare la foto, all'interno della galleria di foto, il cui marker è stato cliccato
    if (bool == true) {
        $('#photo0').css("opacity", "0.4");
    }
}

function GetLocation(location) {
    // aggiunge i dati dell'utente
    var position = document.createElement('input');
    position.setAttribute('id', "position");
    position.setAttribute('type', "radio");
    position.setAttribute('name', "city");
    position.setAttribute('value', "my_position");

    var position_text = document.createElement('div');
    position_text.setAttribute('id', "position-text");
    position_text.setAttribute('class', "float");
    position_text.innerHTML = "Mia Posizione";

    //inserisce il radio button per la mia posizione
    $(position).insertAfter("#venice-text");
    //inserisce poi l'etichetta mia posizione
    $(position_text).insertAfter("#position");

    $("#item-selected-description").css({
        'float': 'left',
        'margin-top': '220px', 'z-index': '13',
        'background-color': 'white'
    }
    );
    currentLocationLatitude = location.coords.latitude;
    currentLocationLongitude = location.coords.longitude;
}

//chiamata in caso di errore sulla geolocalizzazione
function errorEvent(error)
{
    switch (error.code)
    {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}