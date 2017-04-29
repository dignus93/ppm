<!DOCTYPE html>
<html lang="en">
    <head>
        <title>PPMPROGETTO</title>
                     <link rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css" />
        <script src="http://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js"></script>
        <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
                        <link rel="stylesheet" href="http://leaflet.github.io/Leaflet.draw/leaflet.draw.css"/>
        <script src="http://leaflet.github.io/Leaflet.draw/leaflet.draw.js"></script>
        <script src='https://cdnjs.cloudflare.com/ajax/libs/d3/3.4.6/d3.min.js' charset="utf-8"></script>
                        <link rel="stylesheet" href="styles.css">
        <script src="scripts.js" type="text/javascript"></script>   
         <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans">
		 

    </head>
    <body>
        <div id="map"></div>
        <aside>
            <div id="search-panel"> 
                <form id="form">
                    <input id="text-search" type="search" placeholder="Ricerca per testo" name="quest" >
                    <input id="hashtag-search" type="search" placeholder="Ricerca per tag" name="tag" >
                    <input id="florence" type="radio" name="city" value="florence" checked><div class="float">Firenze</div>
                    <input id="rome" type="radio" name="city" value="rome"><div class="float">Roma</div>
                    <input id="venice" type="radio" name="city" value="venice"><div id="venice-text" class="float">Venezia</div>
                    <p id="fromP">Da</p>
                    <p id="toP">A</p>                
                    <input id="from" type="date" name="from" >
                    <input id="to" type="date" name="to">
                    <input id="number" type="search" name="number" placeholder="Numero elementi..">
                    <input  id ="search" type="submit" value="Cerca"> 
                </form>
            </div>
            <div id="item-selected-description"></div> 
        </aside>
        <div class="grid">
            <ul class="photos">
                <li id="list0"><img  id="photo0" class="image_grid" alt="..."/></li>
                <li id="list1"><img  id="photo1" class="image_grid" alt="..."/></li>
                <li id="list2"><img  id="photo2" class="image_grid" alt="..."/></li>
                <li id="list3"><img  id="photo3" class="image_grid" alt="..."/></li>
                <li id="list4"><img  id="photo4" class="image_grid" alt="..."/></li>
                <li id="list5"><img  id="photo5" class="image_grid" alt="..."/></li>
                <li id="list6"><img  id="photo6" class="image_grid" alt="..."/></li>
                <li id="list7"><img  id="photo7" class="image_grid" alt="..."/></li>
                <li id="list8"><img  id="photo8" class="image_grid" alt="..."/></li>
            </ul>
        </div>
        <div id='brush' class='ui-brush'></div>
    </body>
</html>
