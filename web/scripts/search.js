var scrollDist = 0;
lastScrollTop = 0;
var inAlbum = false;
var canSearch = true;
var currentFilesURL = './Music/saved';

// 0 for search, 1 for files
var searchMode = 0;

$(document).ready(function() {

    $(document.body).off('click').on('click', "#searchBack", function() {
        // Determine how the back-button should behave based on context
        if (currentFilesURL != './Music/saved' && searchMode) {
            var lastIndex = currentFilesURL.lastIndexOf("/");
            currentFilesURL = currentFilesURL.slice(0, lastIndex);
            var HTMLToAppend = '';
            eel.reveal_files(currentFilesURL)(function(e) {
                $.each(e[0], function(index, value) {
                    HTMLToAppend += '<div class=folder>'+value+"<div class='folderDel'></div></div>";
                });
                $("#file_grid").css('opacity', 0);
                window.setTimeout(function() {
                    $("#file_grid").css('opacity', 1);
                    $("#file_grid").html(HTMLToAppend);
                    $(".folderDel").on('click', function(e) {
                        e.stopPropagation();
                        eel.delete_folder(currentFilesURL + '/' + $(this).parent().text());
                    });
                    $(".folder").on('click', function() {
                        currentFilesURL += '/'+$(this).text();
                        $("#file_grid").css('opacity', 0);
                        window.setTimeout(function () {
                            getFiles(currentFilesURL);
                            $("#file_grid").css('opacity', 1);
                        }, 500);
                });
                }, 500);
            });

        } else {
            if (!inAlbum) {

                // These options will close the search menu entirely
                $("#search_container").removeClass('search_container_active');
                $('body').css('overflow-y', 'hidden');
                $("#search_container").css('overflow-y', 'hidden');
                $("#button_container").removeClass('search_active_b');
                $("#logo_container").removeClass('search_active_l');
                $("#wave").removeClass('wave_active');
                $("#search_container").removeClass("search_active_sc");
                $("#homeBody").css("overflow", "hidden");
                $("#search_bar h1").removeClass("search_bar_active");
                $("#search_container").removeClass("search_active_sc");
                $("#homeBody").css("overflow", "hidden");
            } else {

                // These options will re-run the search function on what's currently in the search bar
                if (canSearch) {
                    search();
                    canSearch = false;
                }

                setTimeout(function() {
                    inAlbum = false;
                    canSearch = true;
                    $("#search_results").css('filter', 'opacity(1)');
                }, 500);
            }
        }
    });

    // Switch between search and file views
    $("#searchActive").on('click', function() {
        if (searchMode) {
            $("#searchActive").addClass('buttonActive');
            $("#filesActive").removeClass('buttonActive');
            $("#search_panel").css('display', 'block');
            $("#files_panel").css('display', 'none')
            searchMode = 0;
        }
    });
    $("#filesActive").on('click', function() {
        if (!searchMode) {
            $("#filesActive").addClass('buttonActive');
            $("#searchActive").removeClass('buttonActive');
            $("#search_panel").css('display', 'none');
            $("#files_panel").css('display', 'block')
            var HTMLToAppend = '';
            eel.reveal_files(currentFilesURL)(function(e) {
                $.each(e[0], function(index, value) {
                    HTMLToAppend += '<div class=folder>'+value+"<div class='folderDel'></div></div>";
                });
                $("#file_grid").html(HTMLToAppend);
                $(".folderDel").on('click', function(e) {
                    e.stopPropagation();
                    eel.delete_folder(currentFilesURL + '/' + $(this).parent().text());
                });
                $(".folder").on('click', function() {
                    currentFilesURL += '/'+$(this).text();
                    $("#file_grid").css('opacity', 0);
                    window.setTimeout(function() {
                        getFiles(currentFilesURL);
                        $("#file_grid").css('opacity', 1);
                    }, 500);
                });
            });
            searchMode = 1;
        }
    });

    $(".genre_button").off().on('click', function() {
        // When clicking a genre, scrape the Billboard website for one of the genre's current top tracks, load player,
        // and enable the radio
        tag = ($(this).next().html());
        index = Math.floor((Math.random() * 10) + 1);
        eel.get_charts(tag, index)(function(a){
            eel.add_to_queue(unescape(a[0]), unescape(a[1]));
            eel.toggle_radio(true)(function(a){
                if (!a) {
                    eel.toggle_radio();
                    $("#radioButton").addClass('buttonActive');
                }
            });

            if (window.location.pathname == '/main.html') {
                window.location.replace('pages/player.html');
            } else {
                $("#search_container").removeClass('search_container_active');
                $('body').css('overflow-y', 'hidden');
                $("#search_container").css('overflow-y', 'hidden');
            }
        });
    });
});

// TODO fix this
$("#search_container").on('scroll',function() {
    var st = $(this).scrollTop();
    if (st > lastScrollTop) {
        if (scrollDist < 300) {
            scrollDist+=1;
        }
    } else {
        if (scrollDist > 0) {
            scrollDist-=1;
        }
    }
    lastScrollTop = st;
    $("#search_container").css('backgroundPositionY', -scrollDist*2);
});

eel.expose(getFiles);
function getFiles(URL) {
    console.log(currentFilesURL);
    eel.reveal_files(URL)(function(e) {
        var HTMLToAppend = '';
        $.each(e[0], function(index, value) {
            HTMLToAppend += '<div class=folder>'+value+"<div class='folderDel'></div></div>";
        });
        $.each(e[1], function(index, value) {
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(value[0])+'\', \''+escape(value[1])+'\')">'+value[0]+'<span>'+value[1]+'</span><span class="resultPlus"></span></div>';
        });
        $("#file_grid").html(HTMLToAppend);
        $(".folderDel").on('click', function(e) {
            e.stopPropagation();
            eel.delete_folder(currentFilesURL + '/' + $(this).parent().text());
        });
        $(".folder").on('click', function() {
            $("#file_grid").css('opacity', 0);
            currentFilesURL += '/'+$(this).text();
            window.setTimeout(function() {
                $("#file_grid").css('opacity', 1);
                getFiles(currentFilesURL);
            }, 500);
        });
    });
}

// Search function. Finds top songs, albums, and artists for the query
// And now it also searches saved music as well, neat
function search() {
    $("#search_background").css('opacity', '0');
    $("#resultsh1").html("RESULTS");
    $("#search_results").css('filter', 'opacity(0)');

    // Get songs
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.search&track='+$("#search_bar_field").val()+"&limit=4&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";
    HTMLToAppend = '<h4 id="songs">Songs</h4><p id="viewSongs" onclick="getSongs()">View more</p>';
    $.getJSON(jsonURL, function(data) {
        $.each(data['results']['trackmatches']['track'], function(index, value) {
            title = value['name'];
            artist = value['artist'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
        });

        // Get Albums
        jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=album.search&album='+$("#search_bar_field").val()+'&limit=4&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
        $.getJSON(jsonURL, function(data) {
            HTMLToAppend += '<h4 id="albums">Albums</h4><p id="viewAlbums" onclick="getAlbums()">View more</p><div class="album_holder">';
            $.each(data['results']['albummatches']['album'], function(index, value) {
                title = value['name'];
                artist = value['artist'];
                albumArt = value['image'].slice(-1)[0]['#text'];
                if (albumArt != '') {
                    HTMLToAppend += '<div class="search_result album" style="background-image:url('+albumArt+')" onclick="getAlbum(\''+escape(title)+'\',\''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
                }
            });
            HTMLToAppend += '</div>';

            // Get Artists
            jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=artist.search&artist='+$("#search_bar_field").val()+'&limit=4&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
            $.getJSON(jsonURL, function(data) {
                HTMLToAppend += '<h4 id="artists">Artists</h4><p id="viewArtists" onclick="getArtists()">View more</p><div class="artists_holder">';
                $.each(data['results']['artistmatches']['artist'], function(index, value) {
                    title = value['name'];
                    eel.get_artist_image(title)(function(a) {;
                        if (a != '') {
                            $(".artists_holder").append('<div class="search_result artist" style="background-image:url('+a[1]+')" onclick="getArtist(\''+a[0]+'\', \''+a[1]+'\')">'+a[0]+'</div>');
                        }
                    });
                });

                    HTMLToAppend += '</div>';

                    $('body').css("overflow", "auto");
                    $('#search_container').css("overflow", "hidden auto");
                    $('body').css("overflow-x", "hidden");
                    $("#resultsh1").css('animation', 'fade_in 0.4s ease 0.5s forwards');
                    $("#search_results").html(HTMLToAppend);

                    if ($(".album_holder").html() == "") {
                        $("#albums").css('display', 'none');
                        $("#viewAlbums").css('display', 'none');
                    }
                    $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
                    $("#search_results").css('filter', 'opacity(1)');
                    enablePlusChange();
                //});
            });
        });
    });
}

// Runs when user selects "View more." Gets a list of songs and replaces search results
function getSongs() {
    inAlbum = true;
    $("#search_results").css('filter', 'opacity(0)');
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.search&track='+$("#search_bar_field").val()+"&limit=20&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";
    HTMLToAppend = '<h4>Songs</h4>';
    $.getJSON(jsonURL, function(data) {
        $.each(data['results']['trackmatches']['track'], function(index, value) {
            title = value['name'];
            artist = value['artist'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
        });
        HTMLToAppend += '</div>';
        $('body').css("overflow", "auto");
        $('#search_container').css("overflow", "hidden auto");
        $('body').css("overflow-x", "hidden");
        $("#resultsh1").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").html(HTMLToAppend);
        $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").css('filter', 'opacity(1)');
        enablePlusChange();
    });
}

// Just like the above but with albums
function getAlbums() {
    inAlbum = true;
    $("#search_results").css('filter', 'opacity(0)');
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=album.search&album='+$("#search_bar_field").val()+'&limit=20&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
    HTMLToAppend = '<h4>Albums</h4>';
    $.getJSON(jsonURL, function(data) {
        HTMLToAppend += '<div class="album_holder">';
        $.each(data['results']['albummatches']['album'], function(index, value) {
            title = value['name'];
            artist = value['artist'];
            albumArt = value['image'].slice(-1)[0]['#text'];
            if (albumArt != '') {
                HTMLToAppend += '<div class="search_result album" style="background-image:url('+albumArt+')" onclick="getAlbum(\''+escape(title)+'\',\''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
            }
        });
        HTMLToAppend += '</div>';
        $('body').css("overflow", "auto");
        $('#search_container').css("overflow", "hidden auto");
        $('body').css("overflow-x", "hidden");
        $("#resultsh1").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").html(HTMLToAppend);
        $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").css('filter', 'opacity(1)');
    });
}

// Runs when a user selects an album. Gets all tracks from it
function getAlbum(title, artist) {

    document.getElementById("search_bar").scrollIntoView({behavior: "smooth", block: "center"});
    title = unescape(title)
    artist = unescape(artist)

    $("#search_results").css('filter', 'opacity(0)');
    $("#resultsh1").css('filter', 'opacity(0)');
    $("#search_background").css('opacity', '0');
    inAlbum = true;
    jsonURL = "http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8aef36b2e4731be3a1ea47ad992eb984&artist="+encodeURIComponent(artist)+"&album="+encodeURIComponent(title)+"&format=json";
    albumTitle = title;

    $.getJSON(jsonURL, function(data) {
        albumArt = data['album']['image'].slice(-1)[0]['#text']
        var obj = JSON.stringify(data['album']['tracks']['track']);
        HTMLToAppend = '<h2 id="artistName" onclick=\'getArtist("'+artist+'", "")\'>'+artist+'</h2><span onclick=\'addAll('+obj.replace(/'/g,"~")+', "'+albumTitle+'")\' id="add_all">Add all +</span>';
        $("#search_background").css('background', 'linear-gradient(rgba(0,0,0,0.5), #389bfd 50%),url('+albumArt+')');
        $("#search_background").css('backgroundSize', 'cover');
        $("#search_background").css('opacity', '1');
        var trackNum = 0;
        $.each(data['album']['tracks']['track'], function(index, value) {
            title = value['name'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+trackNum+" "+title+'<span class="resultPlus"></span></div></div>';
            trackNum++;
        });
        $('body').css("overflow", "auto");
        $('#search_container').css("overflow", "hidden auto");
        $('body').css("overflow-x", "hidden");
        setTimeout(function () {
            $("#search_results").html(HTMLToAppend);
            $("#resultsh1").html(albumTitle);
            $("#search_results").css('filter', 'opacity(1)');
            $("#search_background").css('opacity', '1');
            $("#resultsh1").css('filter', 'opacity(1)');
            enablePlusChange();
        }, 500);
    });
}

// Gets an artist page
function getArtist(artist, imgURL) {

    document.getElementById("search_bar").scrollIntoView({behavior: "smooth", block: "center"});
    // In case this is being called from the player page, open the search container
    $("#resultsh1").css('filter', 'opacity(0)');
    $("#search_background").css('opacity', '0');
    $("#search_container").addClass('search_container_active');
    // If there is no imgURL, get the artist image
    if (imgURL == "") {

        $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").css('filter', 'opacity(1)');
        eel.get_artist_image(artist)(function(a) {;
            if (a != '') {
                imgURL = a[1];
                $("#search_background").css('background', 'linear-gradient(rgba(0,0,0,0.5), #389bfd 50%),url('+imgURL+')');
                $("#search_background").css('backgroundSize', 'cover');
                $('body').css("overflow", "auto");
                $('#search_container').css("overflow", "hidden auto");
                $('body').css("overflow-x", "hidden");
            }
        });
    }

    artist = unescape(artist)

    $("#search_results").css('filter', 'opacity(0)');
    inAlbum = true;
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&limit=4&artist='+artist+'&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
    HTMLToAppend = '<h4 id="songs">Top Songs</h4>';
    $.getJSON(jsonURL, function(data) {

        $.each(data['toptracks']['track'], function(index, value) {
            title = value['name'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
        });
        enablePlusChange();

        jsonURL = "http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist="+encodeURIComponent(artist)+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";

        $.getJSON(jsonURL, function(data) {
            HTMLToAppend += '<h4 id="albums">Albums</h4><div class="album_holder">';
            $("#search_background").css('background', 'linear-gradient(rgba(0,0,0,0.5), #389bfd 50%),url('+imgURL+')');
            $("#search_background").css('backgroundSize', 'cover');
            if (imgURL != "") {
                $("#search_background").css('opacity', '1');
            }
            $.each(data['topalbums']['album'], function(index, value) {
                title = value['name'];
                artist = value['artist']['name'];
                albumArt = value['image'].slice(-1)[0]['#text'];
                if (albumArt != '') {
                    HTMLToAppend += '<div class="search_result album" style="background-image:url('+albumArt+')" onclick="getAlbum(\''+escape(title)+'\',\''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus"></span></div>';
                }
            });
            HTMLToAppend += "</div>";

            jsonURL = "http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&limit=4&artist="+artist+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";
            $.getJSON(jsonURL, function(data) {
                HTMLToAppend += '<h4 id="albums">Similar Artists</h4><div class="artists_holder">';
                $.each(data['similarartists']['artist'], function(index, value) {
                    title = value['name'];
                    eel.get_artist_image(title)(function(a) {;
                        if (a != '') {
                            $(".artists_holder").append('<div class="search_result artist" style="background-image:url('+a[1]+')" onclick="getArtist(\''+a[0]+'\', \''+a[1]+'\')">'+a[0]+'</div>');
                        }
                    });
                });
                $("#search_results").html(HTMLToAppend);
                setTimeout (function() {
                    $("#resultsh1").html(artist);
                    $("#search_results").css('filter', 'opacity(1)');
                    $("#search_background").css('opacity', '1');
                    $("#resultsh1").css('filter', 'opacity(1)');
                }, 1250);
            });
        });
    });
}

// Show more artists
function getArtists() {
    inAlbum = true;
    $("#search_results").css('filter', 'opacity(0)');
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=artist.search&artist='+$("#search_bar_field").val()+'&limit=20&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
    $.getJSON(jsonURL, function(data) {
        HTMLToAppend = '<div class="artists_holder">';
        $.each(data['results']['artistmatches']['artist'], function(index, value) {
            title = value['name'];
            eel.get_artist_image(title)(function(a) {;
                if (a != '') {
                    $(".artists_holder").append('<div class="search_result artist" style="background-image:url('+a[1]+')" onclick="getArtist(\''+a[0]+'\', \''+a[1]+'\')">'+a[0]+'</div>');
                }
            });
        });
        HTMLToAppend += '</div>';
        $('body').css("overflow", "auto");
        $('#search_container').css("overflow", "hidden auto");
        $('body').css("overflow-x", "hidden");
        $("#resultsh1").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").html(HTMLToAppend);
        $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        $("#search_results").css('filter', 'opacity(1)');
    });
}

function enablePlusChange() {
    $(".search_result").on('click', function() {
        $(this).children(".resultPlus").css('background-image', 'url("../assets/check.png")');
    });
}
