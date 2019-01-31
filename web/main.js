$(document).ready(function() {
    // Play logo animations
    var mySVG = $('#paths').drawsvg({stagger: -100, duration: 1000});
    window.setTimeout(function(){
        mySVG.drawsvg('animate');}, 750);
    var wave = $('#wave').drawsvg({duration: 1000});
    window.setTimeout(function(){
        wave.drawsvg('animate');}, 1500);


    window.setTimeout(function() {
        var waveSVG = document.getElementById("wave");
        var s = Snap(waveSVG);
        var wave1 = Snap.select('#wave1');
        var wave2 = Snap.select('#wave2');

        var wave1Points = wave1.node.getAttribute('d');
        var wave2Points = wave2.node.getAttribute('d');
        var toWave1 = function(){
            console.log("ah");
            wave1.animate({ d: wave2Points }, 1000, mina.backout, toWave2);
        }
        var toWave2 = function(){
              wave2.animate({ d: wave1Points }, 1000, mina.backout, toWave1);
        }
    }, 3000);

//    var svg = document.getElementById("wave");
//    var s = Snap(svg);
//    var wave1 = Snap.select('#wave1');
//    var wave2 = Snap.select('#wave2');
//    var wave1Points = wave1.node.getAttribute('d');
//    var wave2Points = wave2.node.getAttribute('d');
//    var to1 = function(){
//      wave1.animate({ d: wave2Points }, 1000, mina.backout, to2);
//    }
//    var to2 = function(){
//    wave2.animate({ d: wave1Points }, 1000, mina.backout, to1);
//    }
//    to1();


    // Activate search page on click
    $("#search").on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#button_container").addClass('search_active_b');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
        $("#search_container").load("pages/search.html");
    });

    // Get search results
    $("#search_container").on('keyup', function(e) {
        if (e.keyCode == 13) {
            if ($("#search_bar_title").val() != "" && $("#search_bar_artist").val() != "") {
                $("#search_bar").addClass("search_bar_active");
                $("#search_bar h1").addClass("search_bar_active");
                eel.get_search_results($("#search_bar_title").val(),$("#search_bar_artist").val()) (function(a) {
                    $("#homeBody").css("overflow", "auto");
                    $("#homeBody").css("overflow-x", "hidden");
                    $("#search_results").html(a);
                });
            }
        }
    });
    $(document.body).on('click', "#searchBack", function() {
        $("#button_container").removeClass('search_active_b');
        $("#logo_container").removeClass('search_active_l');
        $("#search_container").removeClass("search_active_sc");
        $("#homeBody").css("overflow", "hidden");
        $("#search_bar h1").removeClass("search_bar_active");
    });

});
