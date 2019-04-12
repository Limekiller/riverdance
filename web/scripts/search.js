var scrollDist = 0;
lastScrollTop = 0;
$(document).ready(function() {
    $(".genre_button").on('click', function() {
        console.log("wow dude");
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
