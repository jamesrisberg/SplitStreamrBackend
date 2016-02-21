$( document ).ready(function() {

    // Flash subtitle
    setInterval(function() {
        $("#subtitle").fadeIn(500).fadeOut(500).fadeIn(500).fadeOut(500);
    }, 500);

    hoverChangeImage($('#jacob'), 'img/baby1.gif', 'img/jacob.png');
    hoverChangeImage($('#james'), 'img/nepo.gif', 'img/james.jpg');
    hoverChangeImage($('#joe'), 'img/baby2.gif', 'img/joe.jpg');
});

function hoverChangeImage(elem, pic1, pic2) {
    elem.hover(function() {
        elem.attr("src", pic2);
    }, function() {
        elem.attr("src", pic1);
    });
}
