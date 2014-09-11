var config = {
    httpbase: '/http-bind/'
};

function Client(config) {
    this.con = new JSJaCHttpBindingConnection({'httpbase': config.httpbase});
    this.con.registerHandler('onconnect', JSJaC.bind(this.connected, this));
};

// api
Client.prototype.login = function(jid, pw) {
    var domain = jid.substring(jid.indexOf('@')+1);
    var username = jid.substring(0, jid.indexOf('@'));
    this.con.connect(
        { 'username': username,
          'domain'  : domain,
          'password': pw       }
    );
};

Client.prototype.logout = function() {
    this.con.disconnect();
};

// callbacks
Client.prototype.connected = function() {
    $('.jumbotron').empty();
    $('.jumbotron').text("connected");
    console.log("connected");
    this.con.send(new JSJaCPresence());
};

$("#login").submit(function(form) {

    var jid = form.target.elements[0].value || 'zeank2@jwchat.org';
    var pw  = form.target.elements[1].value || 'hkm18g';

    if (jid == '' || pw == '') {
        // show some error
    } else {

        var client = new Client(config);
        client.login(jid, pw);

        $(window).unload(function() { client.logout(); });
    }

    return false;
});

