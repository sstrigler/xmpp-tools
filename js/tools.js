//////////
// MAIN //
//////////

$("#login").submit(function(form) {
    var jid = form.target.elements[0].value;
    var pw  = form.target.elements[1].value;

    $('.mybox .alert').remove();

    if (jid == '' || pw == '') {
        $('<div class="alert alert-danger">Missing credentials</div>').prependTo('.mybox');
    } else {
        $(form.target).children("button").button("connecting");
        var client = new Client(config);
        client.login(jid, pw);

        $(window).unload(function() { client.logout(); });
    }

    return false;
});

$("nav").hide();
$("#logout-button").click(function(){ location.reload(); });
