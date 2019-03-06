var serverListening = false;
var hovering = 'null';
var sorting = false;
var current_song;
$(document).ready(function() {

    setInterval(function() {
        if (!sorting) {
            eel.get_queue()(function(a){updateArray(a);});
        }
    }, 2000);
    eel.begin_playback();

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
        $(this).animate({backgroundPositionY: '30px'}, 400,
            function() {
                window.setTimeout(function() {
                    $("#ff").css("background-position-y", "0px");
                }, 500);
            });
        eel.download_song(current_song);
    });

    $('#ff').on('click', function() {
        $(this).css('pointer-events', 'none');
        $(this).animate({backgroundPositionX: '30px'}, 400,
            function() {
                window.setTimeout(function() {
                    $("#ff").css("background-position-x", "0px");
                }, 500);
            });
        eel.fast_forward();
    });

    $(document.body).on('click', "#searchBack", function() {
        $("#search_container").removeClass('search_container_active');
        $('body').css('overflow-y', 'hidden');
        $("#search_container").css('overflow-y', 'hidden');
    });

    $('#infoBack').on('click', function() {
        $("#infoContainer").css('margin-top', '-220vh');
    });

    var infotog = 0;
    $('#infoTog').on('click', function() {
        if (!infotog) {
            infotog = 1;
            $('#infoContent h1').html('LYRICS');
            $('#infoTog').attr('src','/assets/info.svg');
            eel.get_lyrics(current_song['track']['artist']['name'], current_song['track']['name'])(function(a){
                $('#content').html(a);
            });
        } else {
            infotog = 0;
            infoToPage();
            $('#infoContent h1').html('ABOUT');
            $('#infoTog').attr('src','/assets/lyrics.svg');
        }
    });

    $('#art').on('click', function() {
        infotog = 0;
        $('#infoTog').attr('src','/assets/lyrics.svg');
        $('#infoContent h1').html('ABOUT');
        infoToPage();
        $("#infoContainer").css('margin-top', '-100vh');
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
                    artist = value['artist'];
                    HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus">+</span></div>';
                });
                $('body').css("overflow", "auto");
                $('#search_container').css("overflow", "auto");
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
               queueData += '<div style="animation:fade_in 0.4s ease forwards;" class="queueSong" id="'+(index-1)+'">'+item[0]+'<span class="queueArtist">'+item[1]+'</span><span class="queueDel">X</span></div>';
        } else {
            if (hovering.includes(item[0]) && hovering.includes(item[1])) {
               queueData += '<div class="queueSong queueSongActive" id="'+(index-1)+'">'+item[0]+
                   '<span class="queueArtist">'+item[1]+'</span><span class="queueDel">X</span></div>';
            } else {
               queueData += '<div class="queueSong" id="'+(index-1)+'">'+item[0]+
                   '<span class="queueArtist">'+item[1]+'</span><span class="queueDel">X</span></div>';
            }
        }
    });
    if ($("#queue").html() != queueData) {
        $("#queue").html(queueData);
        $('.queueDel').on('click', function() {
		$(this).parent().addClass('queueSongDeleted');
		$(".queueDel").css('display', 'none');
		$(this).parent().css('animation', 'fade_out 0.4s ease forwards');
		    deleteIndex($(this).parent().attr('id'));
        });

        $(".queueSong").hover(function() {
            hovering = $(this).html();
            $(this).addClass('queueSongActive');
        }, function() {
            $(this).removeClass('queueSongActive');
            hovering = 'null';
        });

        var elemBefore;
        var elemAfter;
        $("#queue").sortable({
            axis: "y",
            activate: function() {
                elemBefore = $(".ui-sortable-placeholder").prev();
                elemAfter = $(".ui-sortable-placeholder").next();
                sorting = true;
            },
            deactivate: function() {findSwapped(); $(".queueSong").css('pointer-events', 'none');},
            change: function(event, ui) {
                if ($(".ui-sortable-placeholder").prev().attr('id') < elemBefore.attr('id') || $(".ui-sortable-placeholder").prev().attr('id') == undefined) {
                    $(".ui-sortable-placeholder").next().css('animation', 'slideDown 0.2s ease');
                } else {
                    $(".ui-sortable-placeholder").prev().css('animation', 'slideUp 0.2s ease');
                }

                elemBefore = $(".ui-sortable-placeholder").prev();
                elemAfter = $(".ui-sortable-placeholder").next();
                setTimeout(function() {
                    elemBefore.css('animation', '');
                    elemAfter.css('animation', '');
                }, 200);
            },
            animation: 200,
            revert: true
        });
    }
}

function addToQueue(title, artist) {
    $('body').css('overflow-y', 'hidden');
    eel.add_to_queue(unescape(title), unescape(artist));
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
        current_song = data;
        $('#art').css('background-image', 'url('+data['track']['album']['image'][data['track']['album']['image'].length-1]['#text']+')');
    });
}

eel.expose(artLoading);
function artLoading(loading) {
    if (!loading) {
        $("#artLoading").removeClass('artLoadingActive');
        $("#ff").css('pointer-events', 'all');
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
    // hovering = 'null';
    eel.swap_queue(old_index, new_index);
    setTimeout(function() {sorting = false}, 1000);
}

function infoToPage(){
    try {
        $("#content").html(current_song['track']['wiki']['content'].split('Read more on Last.fm')[0]);
    } catch(err) {
        $("#content").html('No description could be found for this track');
    }
    $("#infArtist").html(current_song['track']['artist']['name']);
    $("#infSong").html(current_song['track']['name']);
    $("#infAlbum").html(current_song['track']['album']['title']);
    $('#infoArt').css('background-image', 'url('+current_song['track']['album']['image'][current_song['track']['album']['image'].length-1]['#text']+')');
}
