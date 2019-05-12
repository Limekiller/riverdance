var scrollDist = 0;
lastScrollTop = 0;
$(document).ready(function() {
    $(".genre_button").off().on('click', function() {
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
    console.log(scrollDist);
});

function search() {
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=track.search&track='+$("#search_bar_field").val()+"&limit=4&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json";
    HTMLToAppend = '<h4>Songs</h4>'
    $.getJSON(jsonURL, function(data) {
        $.each(data['results']['trackmatches']['track'], function(index, value) {
            title = value['name'];
            artist = value['artist'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus">+</span></div>';
        });
        jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=album.search&album='+$("#search_bar_field").val()+'&limit=4&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json';
        $.getJSON(jsonURL, function(data) {
            HTMLToAppend += '<h4>Albums</h4><div class="album_holder">';
            $.each(data['results']['albummatches']['album'], function(index, value) {
                title = value['name'];
                artist = value['artist'];
                HTMLToAppend += '<div class="search_result album" style="background-image:url('+value['image'].slice(-1)[0]['#text']+')" onclick="getAlbum(\''+title+'\',\''+artist+'\')">'+title+'<span>'+artist+'</span><span class="resultPlus">+</span></div>';
            });
            HTMLToAppend += '</div>';
            $('body').css("overflow", "auto");
            $('#search_container').css("overflow", "hidden auto");
            $('body').css("overflow-x", "hidden");
            $("#resultsh1").css('animation', 'fade_in 0.4s ease 0.5s forwards');
            $("#search_results").html(HTMLToAppend);
            $("#search_results").css('animation', 'fade_in 0.4s ease 0.5s forwards');
        });
    });
}

function getAlbum(title, artist) {
    jsonURL = 'http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=8aef36b2e4731be3a1ea47ad992eb984&artist='+artist+'&album='+title+'&format=json';
    albumTitle = title;

    $.getJSON(jsonURL, function(data) {
        var obj = JSON.stringify(data['album']['tracks']['track']);
        HTMLToAppend = '<h2>'+artist+'</h2><span onclick=\'addAll('+obj.replace(/'/g,"~")+')\' id="add_all">Add all +</span>';
        $("#search_background").css('background', 'linear-gradient(rgba(0,0,0,0.5), #389bfd 50%),url('+data['album']['image'].slice(-1)[0]['#text']+')');
        $("#search_background").css('backgroundSize', 'cover');
        $("#search_background").css('opacity', '1');
        $.each(data['album']['tracks']['track'], function(index, value) {
            title = value['name'];
            HTMLToAppend += '<div class="search_result" onclick="addToQueue(\''+escape(title)+'\', \''+escape(artist)+'\')">'+title+'<span class="resultPlus">+</span></div></div>';
        });
        $("#search_results").html(HTMLToAppend);
        $("#resultsh1").html(albumTitle);
    });
}
