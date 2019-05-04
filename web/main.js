$(document).ready(function() {
    // Play logo animations
    var mySVG = $('#paths').drawsvg({stagger: -100, duration: 1000});
    window.setTimeout(function(){
        mySVG.drawsvg('animate');}, 750);
    var wave = $('#wave').drawsvg({duration: 1000});
    window.setTimeout(function(){
        wave.drawsvg('animate');}, 1500);

    // Activate search page on click
    $("#search").on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#button_container").addClass('search_active_b');
        $("#wave").addClass('wave_active');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
        $("#search_container").load("pages/search.html");
        $.getScript("scripts/search.js");
    });

    $("#server").on('click', function() {
        $("#button_container").addClass('search_active_b');
        $("#wave").addClass('wave_active');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
        $("#search_container").load("pages/server.html", function() {
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
            var script = document.createElement('script');
            script.onload = function() {
                search();
            };
            script.src = '/scripts/search.js';
            document.head.appendChild(script);
        }
    });

    $(document.body).on('click', "#searchBack", function() {
        $("#button_container").removeClass('search_active_b');
        $("#logo_container").removeClass('search_active_l');
        $("#wave").removeClass('wave_active');
        $("#search_container").removeClass("search_active_sc");
        $("#homeBody").css("overflow", "hidden");
        $("#search_bar h1").removeClass("search_bar_active");
    });

    $("#play").on('click', function() {
        $("#button_container").addClass('search_active_b');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
	setTimeout(function() {window.location.replace('pages/player.html')},500);
    });
});

function addToQueue(title, artist) {
    eel.add_to_queue(unescape(title), unescape(artist));
    window.location.replace('pages/player.html');
}
