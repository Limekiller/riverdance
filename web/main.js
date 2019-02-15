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
            $("#search_bar").addClass("search_bar_active");
            $("#search_bar h1").addClass("search_bar_active");
            jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.search&track='+$("#search_bar_field").val()+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";

            HTMLToAppend = ''
            $.getJSON(jsonURL, function(data) {
                $.each(data['results']['trackmatches']['track'], function(index, value) {
                    title = value['name'];
                    artist = value['artist']
                    HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+title+'\', \''+artist+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus">+</span></div>';
                });
                $("#homeBody").css("overflow", "auto");
                $("#homeBody").css("overflow-x", "hidden");
                $("#resultsh1").css('animation', 'fade_in 0.4s ease forwards');
                $("#search_results").html(HTMLToAppend);
            });

            //eel.get_search_results($("#search_bar_title").val(),$("#search_bar_artist").val()) (function(a) {
            //    $("#homeBody").css("overflow", "auto");
            //    $("#homeBody").css("overflow-x", "hidden");
            //    $("#search_results").html(a);
            //});
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
    eel.add_to_queue(title, artist);
    window.location.replace('pages/player.html');
}
