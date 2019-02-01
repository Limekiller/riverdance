var queue = [];
$(document).ready(function() {
    eel.get_queue()(function(a){updateArray(a);});

    $('#searchButton').on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#search_container").addClass('search_container_active');
        $("#search_container").load("../pages/search.html");
    });

    $(document.body).on('click', "#searchBack", function() {
        $("#search_container").removeClass('search_container_active');
        $("#search_container").css('overflow-y', 'hidden');
    });

    $("#search_container").on('keyup', function(e) {
        if (e.keyCode == 13) {
            if ($("#search_bar_title").val() != "" && $("#search_bar_artist").val() != "") {
                $("#search_bar").addClass("search_bar_active");
                $("#search_bar h1").addClass("search_bar_active");
                eel.get_search_results($("#search_bar_title").val(),$("#search_bar_artist").val()) (function(a) {
                    $("#search_results").html(a);
                    $("#search_container").css('overflow-y', 'auto');
                });
            }
        }
    });

});

function updateArray(array, variable){
    variable = array.slice();
    var queueData = '';
    variable.forEach(function(item) {
       queueData += "<div class='queueSong' id='"+item[1]+"'>"+item[0]+"</div>";
    });
    $("#queue").html(queueData);
}

function addToQueue(link, title) {
    eel.add_to_queue(title, link);
    eel.get_queue()(function(a) {
        eel.get_queue()(function(a){updateArray(a);});
        $("#search_container").removeClass('search_container_active');
        $("#search_container").css('overflow-y', 'hidden');
    });
}
