var scrollDist = 0;
lastScrollTop = 0;
$(document).ready(function() {
    $(".genre_button").off().on('click', function() {
        tag = ($(this).next().html());
        console.log(tag);
        index = Math.floor((Math.random() * 10) + 1);
        $.getJSON( "http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag="+tag+"&api_key=8aef36b2e4731be3a1ea47ad992eb984&format=json", function( data ) {
            song = data['tracks']['track'][index]['name'];
            artist = data['tracks']['track'][index]['artist']['name'];
            eel.add_to_queue(unescape(song), unescape(artist));

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
