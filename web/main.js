$(document).ready(function() {
    var mySVG = $('#paths').drawsvg({stagger: -100, duration: 1000});
    window.setTimeout(function(){
        mySVG.drawsvg('animate');}, 750);
    var wave = $('#wave').drawsvg({duration: 1000});
    window.setTimeout(function(){
        wave.drawsvg('animate');}, 1500);
});
