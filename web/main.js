$(document).ready(function() {
    //$.getScript("scripts/search.js");
    $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
    // Play logo animations
    var mySVG = $('#paths').drawsvg({stagger: -100, duration: 1000});
    window.setTimeout(function(){
        mySVG.drawsvg('animate');}, 750);
    var wave = $('#wave').drawsvg({duration: 1000});
    window.setTimeout(function(){
        wave.drawsvg('animate');}, 1500);

    // Activate search page on click
    $("#search").on('click', function() {
        $("#search_container").load("pages/search.html");
        $("#button_container").addClass('search_active_b');
        $("#wave").addClass('wave_active');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");

        setTimeout(function() {
            $("#search_container").prepend("<div id='search_background'></div>");
        }, 1000);
        $.getScript("scripts/search.js");
    });

    $("#server").on('click', function() {
        $("#button_container").addClass('search_active_b');
        $("#wave").addClass('wave_active');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
        $("#search_container").load("pages/server.html", function() {
            $("#searchBack").on('click', function() {
                $('#serverButton').removeClass('buttonActive');
            });
            $("#submit").on('click', function() {
                window.location.replace('pages/player.html')
            });
        });
    });

    // Get search results
    $("#search_container").on('keyup', function(e) {
        if (e.keyCode == 13) {
            $("#genres").fadeOut();
            $("#search_bar").addClass("search_bar_active");
            $("#search_bar h1").addClass("search_bar_active");
            search();
        }
    });


    $("#play").on('click', function() {
        $("#button_container").addClass('search_active_b');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
	setTimeout(function() {window.location.replace('pages/player.html')},500);
    });
});

function addAll(data) {
    eel.add_album(data);
    window.location.replace('pages/player.html');
}

function addToQueue(title, artist) {
    eel.add_to_queue(unescape(title), unescape(artist));
    window.location.replace('pages/player.html');
}
