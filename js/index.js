$(function () {
    var $toggleLink = $("#toggleLink");
    $("#moreProjects").bind('shown', function () {
        var topleft = $(this).offset();

        $('html, body').animate({
            scrollTop: topleft.top,
            scrollLeft: topleft.left
        });

        $toggleLink.html("\u00ab See fewer projects");
    })
    .bind('hidden', function () {
        $toggleLink.html("See more projects \u00bb");
    });
});