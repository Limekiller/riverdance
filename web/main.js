$(document).ready(function() {
    var mySVG = $('#paths').drawsvg({stagger: -100, duration: 1000});
    window.setTimeout(function(){
        mySVG.drawsvg('animate');}, 750);
    var wave = $('#wave').drawsvg({duration: 1000});
    window.setTimeout(function(){
        wave.drawsvg('animate');}, 1500);

    $("#search").on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#button_container").addClass('search_active_b');
        $("#logo_container").addClass('search_active_l');
        $("#search_container").addClass("search_active_sc");
        $("#search_container").load("pages/search.html");
    });

    $("#search_container").on('keyup', '#search_bar_text', function(e) {
        if (e.keyCode == 13) {
            console.log($("#search_bar_text").val());
            eel.get_search_results($("#search_bar_text").val());
        }
    });
});
