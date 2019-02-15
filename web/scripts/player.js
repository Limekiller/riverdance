var serverListening = false;
var hovering = false;
$(document).ready(function() {

    setInterval(function() {
        if (!hovering) {
            eel.get_queue()(function(a){updateArray(a);});
        }
    }, 2000);
    eel.begin_playback();

    $("#queue").hover(function() {
        hovering = true;
        console.log('ah');
    }, function() {
        hovering = false;
    });

    $('#searchButton').on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#search_container").addClass('search_container_active');
        $("#search_container").load("../pages/search.html");
    });

    $('#serverButton').on('click', function() {
        if (!serverListening) {
            $("#search_container").addClass('search_container_active');
            $("#search_container").load("../pages/server.html");
            $('#serverButton').addClass('buttonActive');
            serverListening = true;
        } else {
            eel.unset_email();
            $('#serverButton').removeClass('buttonActive');
            serverListening = false;
        }
    });

    $('#radioButton').on('click', function() {
        eel.toggle_radio()(function (a) {
            if (a) {
                $('#radioButton').addClass('buttonActive');
            } else {
                $('#radioButton').removeClass('buttonActive');
            }
        });
    });

    $('#play').on('click', function() {
        eel.pause_music();
    });

    $('#dl').on('click', function() {
        eel.download_song();
    });

    $('#ff').on('click', function() {
        eel.fast_forward();
    });

    $(document.body).on('click', "#searchBack", function() {
        $("#search_container").removeClass('search_container_active');
        $('body').css('overflow-y', 'hidden');
        $("#search_container").css('overflow-y', 'hidden');
    });

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
                $('body').css("overflow", "auto");
                $('body').css("overflow-x", "hidden");
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
});

function updateArray(array){
    var queueData = '';
    array.forEach(function(item, index) {
	if (index == 0) {
		$("#songTitle").html(item[0]);
		$("#songArtist").html(item[1]);
	} else if ($('#'+(index-1)).length == 0) {
           queueData += '<div style="animation:queueLoad 0.4s ease forwards;" class="queueSong" id="'+(index-1)+'">'+item[0]+'<span class="queueArtist">'+item[1]+'</span><span class="queueDel">X</span></div>';
       } else {
           queueData += '<div class="queueSong" id="'+(index-1)+'">'+item[0]+
               '<span class="queueArtist">'+item[1]+'</span><span class="queueDel">X</span></div>';
       }
    });
    if ($("#queue").html() != queueData && !hovering) {
        $("#queue").html(queueData);
        $('.queueDel').on('click', function() {
		$(this).parent().addClass('queueSongDeleted');
		$(".queueDel").css('display', 'none');
		$(this).parent().css('animation', 'queueUnload 0.4s ease forwards');
		    deleteIndex($(this).parent().attr('id'));
        });

        $("#queue").sortable({
            axis: "y",
            activate: function() {hovering = true; },
            deactivate: function() {hovering = false; findSwapped(); },
            animation: 200,
            revert: true
        });
    }
}

function addToQueue(title, artist) {
    $('body').css('overflow-y', 'hidden');
    eel.add_to_queue(title, artist);
   // setTimeout(function () {
   //     $("#queue").append('<div style="animation:queueLoad 0.4s ease forwards;" class="queueSong">'+title+'<span class="queueArtist">'+artist+'</span></div>');
   // }, 1000);
    $("#search_container").removeClass('search_container_active');
    $("#search_container").css('overflow-y', 'hidden');
	$(".queueDel").css('display', 'none');
}

function deleteIndex(index) {
    eel.delete_from_queue(index);
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

function findSwapped() {
    var old_index;
    var new_index;
    var current_sum = -99;
    $("#queue").children().each(function(index) {
        this_index = $(this).attr('id');
        if (this_index != index && Math.abs(this_index - index) > current_sum) {
            current_sum = Math.abs(this_index - index);
            old_index = $(this).attr('id');
            new_index = index;
        }
    });
    eel.swap_queue(old_index, new_index);
}
