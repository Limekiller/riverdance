var serverListening = false;
var hovering = 'null';
var sorting = false;
var current_song;
var radio = false;

// if 0, queue; if 1, files
var menuSelected = 0;
var fileViewURL = './Music/saved';

var realTitle;
var realArtist;
var queueInterval;

var timerVar = setInterval(updateTimers, 1000);
var totalSeconds = 0;
var paused = true;
var currSongLength = null;
var focused = true;

$(document).ready(function() {

    eel.toggle_radio(true)(function(a){
        if (a){
            $('#radioButton').addClass('buttonActive');
        }
    });

    // Listen for unfocus event
    // Because CSS animation is used for playbar, it won't start when the window isn't focused
    // So here what we're doing is calculating where the playbar should be at when the window comes into focus again
    // TODO: fix bus with this, such as playbar starting if leave and resume focus while loading
    $(window).blur(function() {
        focused = false;
    });
    $(window).focus(function() {
        if (!focused && !paused) {
            var timePercent = totalSeconds/currSongLength;
            var timeLeft = currSongLength-totalSeconds;
            var widthTo = $("#playBar").width()*timePercent;
            $("#playBarActive").css('transition', 'width 0.5s ease');
            $("#playBarActive").css("width", widthTo+'px');
            window.setTimeout(function() {
                $("#playBarActive").css('transition', 'width '+timeLeft+'s linear');
                $("#playBarActive").css("width", '100%');
            }, 400);
        }
    });

    // Continually query the back-end for queue information
    queueInterval = setInterval(function() {
        if (!sorting) {
            eel.get_queue()(function(a){updateArray(a);});
        }
    }, 2000);

    // If the player was opened through the create server page, let the UI reflect that
    eel.get_email()(function (a) {
        if (a) {
            $('#serverButton').addClass('buttonActive');
            serverListening = true;
        } else {
            $('#serverButton').removeClass('buttonActive');
            serverListening = false;
        }
    });

    eel.begin_playback();

    // Show the splash every 10s,
    splashTimeout = setTimeout(function() {
        $("#artistSplash").addClass('showSplash');
    }, 10000);
    // But fade it out/cancel the timer every time the mouse moves
    $(document).mousemove(function(event) {
        $("#artistSplash").removeClass('showSplash');
        clearTimeout(splashTimeout);
        splashTimeout = setTimeout(function() {
            $("#artistSplash").addClass('showSplash');
        }, 10000);
    });

    // Audio
    $("#audioBar").on('click', function(e) {
        var eVar =  e.pageX - $(this).offset().left;
        var percent = ((eVar) / $(this).width())*100;
        $("#audioBarUI").css('width', (percent)+"%");
        eel.set_audio(percent);
    });

    // Show search on button click
    $('#searchButton').on('click', function() {
        $('head').append('<link rel="stylesheet" type="text/css" href="styles/search.css">');
        $("#search_container").addClass('search_container_active');
        $("#search_container").load("../pages/search.html");

        setTimeout(function() {
            $("#search_container").prepend("<div id='search_background'></div>");
        }, 1000);
        $.getScript("../scripts/search.js");
    });

    // Show server page on button click
    $('#serverButton').on('click', function() {
        if (!serverListening) {
            $("#search_container").addClass('search_container_active');
            $("#search_container").load("../pages/server.html", function() {
                $("#searchBack").on('click', function() {
                    $('#serverButton').removeClass('buttonActive');
                    serverListening = false;
                });
            });
            $('#serverButton').addClass('buttonActive');
            serverListening = true;
        } else {
            eel.unset_email();
            $('#serverButton').removeClass('buttonActive');
            serverListening = false;
        }
    });

    // Enable radio on button press
    $('#radioButton').on('click', function() {
        if (radio) {
            $('#radioButton').addClass('buttonActive');
        } else {
            $('#radioButton').removeClass('buttonActive');
        }
        eel.toggle_radio()(function (a) {
            if (a) {
                $('#radioButton').addClass('buttonActive');
            } else {
                $('#radioButton').removeClass('buttonActive');
            }
        });
    });

    // Pause and unpause
    $('#play').on('click', function() {
        var percent = (parseInt($("#playBarActive").css('width'))/window.innerWidth)*100
        eel.pause_music(percent)(function(a) {
            if (a != 'pausing') {
                $("#playBarActive").css('transition', 'width '+a+'s linear');
                $("#playBarActive").css('width', '100%');
            }
        });
    });

    // Download song
    $('#dl').on('click', function() {
        if ($(this).css('background-position-y') == '0px') {
            $('#dl').css('background-position-y', '-30px');
            toggleEnabled('#dl', true);
        } else {
            $('#dl').css('background-position-y', '0px');
            toggleEnabled('#dl', false);
        }
        eel.download_song(current_song);
    });

    // Fast forward
    $('#ff').on('click', function() {
        toggleEnabled('#playerControls', false);
        $("#playBarActive").css("transition", "");
        $("#playBarActive").css("width", "0");
        // just animation stuff
        $(this).animate({backgroundPositionX: '30px'}, 400,
            function() {
                window.setTimeout(function() {
                    $("#ff").css("background-position-x", "0px");
                }, 500);
            });
        eel.fast_forward();
    });

    $('#infoBack').on('click', function() {
        $("#infoContainer").css('margin-top', '-220vh');
    });

    // Switch between about and lyrics pages
    var infotog = 0;
    $('#infoTog').on('click', function() {
        $("#infoContent h1").css('opacity', '0');
        $("#infoContent h1").css('animation', 'slideUp 0.4s ease reverse forwards');
        setTimeout(function() {
            if (!infotog) {
                $('#infoContent h1').html('ABOUT');
            } else {
                $('#infoContent h1').html('LYRICS');
            }
            $("#infoContent h1").css('opacity', '1');
            $("#infoContent h1").css('animation', 'slideDown 0.4s ease forwards');
        }, 500);

        $("#content").css('opacity', '0');
        if (!infotog) {
            infotog = 1;
            $('#infoTog').attr('src','/assets/info.svg');
            eel.get_lyrics(current_song['track']['artist']['name'], current_song['track']['name'])(function(a){
                $("#content").css('opacity', '1');
                $('#content').html(a);
            });
        } else {
            infotog = 0;
            infoToPage();
            $('#infoTog').attr('src','/assets/lyrics.svg');
        }
    });

    // Show song info when clicking album art
    $('#art').on('click', function() {
        infotog = 0;
        $('#infoTog').attr('src','/assets/lyrics.svg');
        $('#infoContent h1').html('ABOUT');
        infoToPage();
        $("#infoContainer").css('margin-top', '-100vh');
    });

    // Move playbar to time on click
    // Works by finding the percent of width from the left that the user clicked, passing that to the Python
    // and calculating that percentage of the actual song to know where to play from. Then we figure out, given that starting point,
    // how much time is left in order to keep the playbar animation and timers consistent
    $("#playBar").on('click', function(e) {
        $("#timeHolder").css('animation', 'none');
        //var eVar = e.pageX;
        var eVar =  e.pageX - $(this).offset().left;
        var percent = ((eVar) / $(this).width())*100;
        //var percent = (((e.pageX) / $(this).width())*100)-3;
        paused = true;
        $("#timeHolder").css('animation', 'changeTime 1.25s ease');
        $("#playBarActive").css('transition', 'width 0.5s ease');
        eel.set_time(percent)(function(a){
            $("#playBarActive").css("width", eVar);
            totalSeconds = currSongLength - a;
            paused = false;
            setTimeout(function() {
                $("#playBarActive").css('transition', 'width '+a+'s linear');
                $("#playBarActive").css("width", '100%');
            }, 500);
        });
    });

    // Show the playbar ghost on hover
    $("#playBar").mousemove( function(e) {
        var eVar = e.pageX;
        var percent = (((e.pageX) / $(this).width())*100)-3;
        $("#playBarHelper").css('width', percent+'%');
    });

    // Get Last.fm search results on hitting enter on search
    $("#search_container").on('keyup', function(e) {
        if (e.keyCode == 13) {
            $("#genres").fadeOut();
            $("#search_bar").addClass("search_bar_active");
            $("#search_bar h1").addClass("search_bar_active");
            var script = document.createElement('script');
            script.onload = function() {
                inAlbum = false;
                search();
            };
            script.src = '/scripts/search.js';
            document.head.appendChild(script);
        }
    });
});

// This is used to load an artist or album page from the player page, in case the search hasn't been loaded yet
function loadFromPlayer(type, vars){
    $("#search_container").addClass('search_container_active');
    $("#search_container").load("../pages/search.html");

    setTimeout(function() {
        $("#search_container").prepend("<div id='search_background'></div>");
        $("#genres").fadeOut();
        $(".album_holder").css('filter', 'opacity(0)');
        $("#search_bar").addClass("search_bar_active");
        $("#search_bar h1").addClass("search_bar_active");
        $("#search_bar_field").val(vars[0]);
    }, 250);
    $.getScript("../scripts/search.js").done(function() {
        search(vars[0]);
        if (type == "artist") {
            getArtist(vars[0], vars[1]);
            inAlbum = false;
        } else {
            getAlbum(vars[0], vars[1]);
            inAlbum = false;
        }
    });
    setTimeout(function() {
        $("#resultsh1").css('opacity', '1');
        $(".album_holder").css('filter', 'opacity(1)');
        $("#search_results").css('opacity', '1');
        $("#resultsh1").css('filter', 'opacity(1)');
        $("body").css("overflow", "hidden");
    }, 1250);
}

// This function runs every few seconds and updates the song array. Most of the code here is to handle animations
// and such, trying to keep the UI as smooth as possible
function updateArray(array){
    var queueData = '';
    var nextSong = false;
    array.forEach(function(item, index) {
        // If we're adding an album, do the stuff we need to
        if (item[1] === "%%%album_start%%%") {
            queueData += '<div id="'+(index-1)+'" class="queue_album '
            if (item[2] == 'closed') {
                queueData += 'closed';
            } else {
                queueData += 'open';
            }
            queueData+='"><h3 class="alb_h3" >'+item[0]+'</h3>';
            return;
        } else if (item[1] == "%%%album_end%%%") {
            queueData += '<div id="'+(index-1)+'"></div></div>';
            return;
        }

        // If the first song is different, that means we're actually moving to a new song.
        // Play queue and title animations as we transition
        if (index == 0) {
            if ($("#songTitle").text() != item[0]) {
                $("#songInfo").css('animation', 'changeTime 1s ease');
                nextSong = true;

                setTimeout(function() {
                    $("#songTitle").html(item[0]);
                    $("#songArtist").html(item[1]);
                }, 500);
                setTimeout(function() {
                    $("#songInfo").css('animation', '');
                }, 1000);
            }
            // Otherwise, if the item is not already in the list (it's a new item), add a fade-in animation to it.
        } else if ($('#'+(index-1)).length == 0) {
            queueData += '<div style="animation:fade_in 0.4s ease forwards;" class="queueSong" id="'+(index-1)+'">'+item[0]+'<span class="queueArtist">'+item[1]+'</span><div class="source '+item[3]+'"></div><span class="queueDel">X</span></div>';
            // Else, just add the song without adding animations
        } else {
            // However, again, to make it a smoother experience, check if the item is currently being hovered,
            // and if so, add the hovering classes right away so there is no unwanted animation
            if (hovering.includes(item[0]) && hovering.includes(item[1])) {
                queueData += '<div class="queueSong queueSongActive" id="'+(index-1)+'">'+item[0]+
                    '<span class="queueArtist">'+item[1]+'</span><div class="source '+item[3]+'"></div><span class="queueDel">X</span></div>';
            } else {
                queueData += '<div class="queueSong" id="'+(index-1)+'">'+item[0]+
                    '<span class="queueArtist">'+item[1]+'</span><div class="source '+item[3]+'"></div><span class="queueDel">X</span></div>';
            }
        }
    });


    // Only update the queue if it has changed
    if ($("#queue").html() != queueData) {
        // Play the queue animation if we are moving to the next song
        if (nextSong) {
            $("#0").css('opacity', '0');
            $("#0").css('margin-top', '-80px');
            setTimeout(function() {
                $("#queue").html(queueData);
            }, 500);
        } else {
            $("#queue").html(queueData);
        }
        // Delete queue items on click
        $('.queueDel').on('click', function() {
            clearTimeout(queueInterval);
            $(this).parent().addClass('queueSongDeleted');
            $(".queueDel").css('display', 'none');
            $(this).parent().css('animation', 'fade_out 0.4s ease forwards');
            deleteIndex($(this).parent().attr('id'));

            setTimeout(function() {
                eel.get_queue()(function(a){updateArray(a);});
            }, 250);
            queueInterval = setInterval(function() {
                if (!sorting) {
                    eel.get_queue()(function(a){updateArray(a);});
                }
            }, 2000);
        });

        $(".queue_album h3").on('click', function() {
            eel.toggle_album_view($(this).html());

            if ($(this).parent().hasClass('closed')) {
                $(this).parent().removeClass('closed');
            } else {
                $(".queue_album .queueSong").css('animation', 'fade_out 0.4s ease forwards');
                $(this).parent().css('max-height', '32px');
                window.setTimeout(function() {
                    $(this).parent().addClass('closed');
                }, 400);
            }
        });

        // Add or remove classes based on hover
        $(".queueSong").hover(function() {
            hovering = $(this).html();
            $(this).addClass('queueSongActive');
        }, function() {
            $(this).removeClass('queueSongActive');
            hovering = 'null';
        });

        // Allow queue items to be draggable and sortable
        var elemBefore;
        var elemAfter;
        sortOptions = {
            axis: "y",
            activate: function() {
                elemBefore = $(".ui-sortable-placeholder").prev();
                elemAfter = $(".ui-sortable-placeholder").next();
                sorting = true;
            },
            deactivate: function(event, ui) {findSwapped($(this), $(ui.item).data('sortable-item').currentItem[0].id);$(".queueSong").css('pointer-events', 'none');},
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
            revert: true,
            cancel: 'h3'
        }
        $("#queue").sortable(sortOptions);
        $(".queue_album").sortable(sortOptions);
    }
}

function addToQueue(title, artist) {
    $('body').css('overflow-y', 'hidden');
    eel.add_to_queue(unescape(title), unescape(artist));

    $("#search_container").removeClass('search_container_active');
    $("#search_container").css('overflow-y', 'hidden');
    $(".queueDel").css('display', 'none');
}

function deleteIndex(index) {
    eel.delete_from_queue(index);
}

eel.expose(getAlbumArt);
function getAlbumArt(title, artist) {

    title = title.replace('official audio','');
    title = title.replace('official video','');
    title = title.replace('official music video','');

    searchJSONURL = 'http://ws.audioscrobbler.com/2.0/?method=track.search&api_key=8aef36b2e4731be3a1ea47ad992eb984&artist='+encodeURIComponent(artist)+'&track='+encodeURIComponent(title)+'&format=json';

    $.getJSON(searchJSONURL, function(data) {
        try {
            realTitle = data['results']['trackmatches']['track'][0]['name'];
            realArtist = data['results']['trackmatches']['track'][0]['artist'];
            jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=8aef36b2e4731be3a1ea47ad992eb984&artist='+realArtist+'&track='+realTitle+'&format=json'

            $.getJSON(jsonURL, function(dat2) {
                try {
                    current_song = dat2;
                    $('#art').css('background-image', 'url('+dat2['track']['album']['image'][dat2['track']['album']['image'].length-1]['#text']+')');

                    $("#splashSongArtist").html(current_song['track']['artist']['name']);
                    $("#splashSongTitle").html(current_song['track']['name']);
                    $('#artistSplash').css('background-image', 'url('+current_song['track']['album']['image'][current_song['track']['album']['image'].length-1]['#text']+')');
                } catch(err) {
                    $("#splashSongTitle").html(title);
                    $("#splashSongArtist").html(artist);
                    $("#artistSplash").css('background-image', 'none');
                    $("#art").css('background-image', 'url(/assets/no_art.svg');
                }
            });
        } catch(err) {
            $("#splashSongArtist").html(title);
            $("#splashSongTitle").html(artist);
        }
    });
}

eel.expose(toggleEnabled);
function toggleEnabled(elemString, toggleBool) {
    if (toggleBool) {
        $(elemString).css('opacity', '1');
        $(elemString).css('pointer-events', 'all');
    } else {
        if (elemString == "#dl") {
            $('#dl').css('background-position-y', '0px');
        }
        $(elemString).css('opacity', '0.5');
        $(elemString).css('pointer-events', 'none');
    }
}

function updateTimers() {
    if (!paused && totalSeconds < currSongLength-1) {
        ++totalSeconds;
        var minute = Math.floor(totalSeconds / 60);
        var seconds = Math.floor(totalSeconds - (minute*60)) > 9 ? "" +Math.floor(totalSeconds-(minute*60)): "0" + Math.floor(totalSeconds-(minute*60));
        $('#from').html(minute+':'+seconds);
        minute = Math.floor((currSongLength - totalSeconds) / 60)
        seconds = Math.floor((currSongLength - totalSeconds) - (minute*60)) > 9 ? ""+Math.floor((currSongLength - totalSeconds) - (minute*60)): "0" + Math.floor((currSongLength - totalSeconds) - (minute*60));
        $('#to').html(minute+':'+seconds);
    }
}


eel.expose(setCurrSongLength);
function setCurrSongLength(length) {
    currSongLength = length*.001;
}


eel.expose(artLoading);
function artLoading(loading) {
    if (!loading) {
        $("#artLoading").removeClass('artLoadingActive');
        $("#dl").css('background-position-y', '-30px');
        $("#play").css('background-position-x', '155px');
        toggleEnabled("#playerControls", true);
        toggleEnabled("#dl", true);
        paused = false;
        //$('#songTitle').html(realTitle);
    } else {
        $("#playBarActive").css("transition", "");
        $("#playBarActive").css("width", "0");
        $("#artLoading").addClass('artLoadingActive');
        toggleEnabled("#playerControls", false);
        paused = true;
        totalSeconds = 0;
    }
}

eel.expose(getPercent);
function getPercent(totalLength) {
    $("#playBarActive").css("transition", "");
    $("#playBarActive").css("width", "0%");
    $("#playBarActive").css("transition", "width "+totalLength*.001+"s linear");
    setTimeout(function(){
        $("#playBarActive").css("width", "100%");
    }, 500);
}

function findSwapped(div, draggedID) {
    realIndex = -1;
    var new_index;
    div.children().each(function() {
        if ($(this).hasClass("alb_h3")) {
            realIndex = parseInt($(this).parent().attr('id'));
            return;
        }
        realIndex++;
        if ($(this).attr('id') == draggedID) {
            new_index = realIndex;
            return false;
        }
        if ($(this).hasClass('queue_album') && !div.hasClass('queue_album')) {
            realIndex = realIndex + $(this).children().length - 1;
            console.log(realIndex);
        }

    });
    eel.swap_queue(draggedID, new_index);
    setTimeout(function() {sorting = false}, 1000);
}

//function findSwapped(div, draggedID) {
//    var old_index;
//    var new_index;
//    var current_sum = -99;
//    realIndex = -1;
//    div.children().each(function(index) {
//        console.log(div.children());
//        if ($(this).hasClass("alb_h3")) {
//            return;
//        }
//
//        realIndex++;
//        this_index = $(this).attr('id');
//        if (div.hasClass('queue_album') && realIndex == 0) {
//            realIndex = parseInt(realIndex) + parseInt(this_index);
//        }
//        if (this_index != realIndex && Math.abs(this_index - realIndex) > current_sum) {
//            current_sum = Math.abs(this_index - realIndex);
//            old_index = $(this).attr('id');
//            new_index = realIndex;
//        }
//        if ($(this).hasClass('queue_album') && !div.hasClass('queue_album')) {
//            realIndex = $(this).children().last().attr('id');
//        }
//    });
//    // hovering = 'null';
//    // if (div.hasClass('queue_album')) {
//    //     new_index = parseInt(new_index) + parseInt(div.attr('id'));
//    // }
//    console.log(old_index);
//    console.log(new_index);
//    eel.swap_queue(old_index, new_index);
//    setTimeout(function() {sorting = false}, 1000);
//}

function infoToPage(){
    eel.get_info(current_song['track']['artist']['name'], current_song['track']['name'])(function(a){
        $("#content").css('opacity', '1');
        if (a != '') {
            $("#content").html(a);
        } else {
            $("#content").html("No description could be found for this track");
        }
    });

    $("#infArtist").html(current_song['track']['artist']['name']);
    $("#infSong").html(current_song['track']['name']);
    $("#infAlbum").html(current_song['track']['album']['title']);
    $('#infoArt').css('background-image', 'url('+current_song['track']['album']['image'][current_song['track']['album']['image'].length-1]['#text']+')');

}

eel.expose(togglePlayButton);
function togglePlayButton(isPaused) {
    if (isPaused) {
        $("#play").css('background-position-x', '155px');
        $("#playBarActive").css("width", "100%");
        paused = false;
    } else {
        $("#play").css('background-position-x', '65px');
        $("#playBarActive").css("width", $("#playBarActive").width());
        paused = true;
    }
}

function addAll(data, albumName) {
    eel.add_album(data, albumName);
    $("#search_container").removeClass('search_container_active');
    $('body').css('overflow-y', 'hidden');
    $("#search_container").css('overflow-y', 'hidden');
}

function get_files() {

    eel.reveal_files(fileViewURL)(function(e) {
        for (var i = 0; i < e[0].length; i++) {
            $("#files").append("<div class='folder'>"+e[0][i]+"</div>");
        }
        for (var i = 0; i < e[1].length; i++) {
            $("#files").append("<div class='file'>"+e[1][i]+"</div>");
        }
        $(".folder").on('click', function() {
            $("#files").html('');
            fileViewURL += '/' + $(this).html();
            get_files();
        });
        $(".file").on('click', function() {
            splitString = fileViewURL.split("/");
            eel.add_to_queue(unescape($(this).html()), unescape(splitString[3]));
        });
    });
}

eel.expose(getCurrentSong);
function getCurrentSong() {
    return current_song;
}
