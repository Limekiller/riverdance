$(document).ready(function() {

    setInterval(function() {
        eel.get_queue()(function(a){updateArray(a);});
    }, 1000);
    eel.begin_playback();

    $('#searchButton').on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#search_container").addClass('search_container_active');
        $("#search_container").load("../pages/search.html");
    });

    $('#play').on('click', function() {
        eel.pause_music();
    });

    $(document.body).on('click', "#searchBack", function() {
        $("#search_container").removeClass('search_container_active');
        $('body').css('overflow-y', 'hidden');
        $("#search_container").css('overflow-y', 'hidden');
    });

    $("#search_container").on('keyup', function(e) {
        if (e.keyCode == 13) {
            if ($("#search_bar_title").val() != "" && $("#search_bar_artist").val() != "") {
                $("#search_bar").addClass("search_bar_active");
                $("#search_bar h1").addClass("search_bar_active");
                eel.get_search_results($("#search_bar_title").val(),$("#search_bar_artist").val()) (function(a) {
                    $("#search_results").html(a);
                    $('body').css('overflow-y', 'auto');
                });
            }
        }
    });

});

function updateArray(array){
    var queueData = '';
    array.forEach(function(item) {
       queueData += "<div class='queueSong' id='"+item[2]+"'>"+item[0]+
           "<span class='queueArtist'>"+item[1]+"</span></div>";
    });
    $("#queue").html(queueData);
}

function addToQueue(link, artist, title) {
    $('body').css('overflow-y', 'hidden');
    eel.add_to_queue(artist, title, link);
    eel.get_queue()(function(a) {
        eel.get_queue()(function(a){updateArray(a);});
        $("#search_container").removeClass('search_container_active');
        $("#search_container").css('overflow-y', 'hidden');
    });
}

eel.expose(getAlbumArt);
function getAlbumArt(artist, title) {
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=8aef36b2e4731be3a1ea47ad992eb984&artist='+title+'&track='+artist+'&format=json'
    $.getJSON(jsonURL, function(data) {
        $('#art').css('background-image', 'url('+data['track']['album']['image'][2]['#text']+')');
    });
}

eel.expose(artLoading);
function artLoading(loading) {
    if (!loading) {
        $("#artLoading").removeClass('artLoadingActive');
    } else {
        $("#artLoading").addClass('artLoadingActive');
    }
}
