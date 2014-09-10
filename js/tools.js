var config = {
    httpbase: '/http-bind/'
};

function Client(config) {
    this.con = new JSJaCHttpBindingConnection({'httpbase': config.httpbase});
    this.con.registerHandler('onconnect', JSJaC.bind(this.connected, this));
};

Client.prototype.login = function(jid, pw) {
    var domain = jid.substring(jid.indexOf('@')+1);
    var username = jid.substring(0, jid.indexOf('@'));
    this.con.connect(
        { 'username': username,
          'domain'  : domain,
          'password': pw       }
    );
};

Client.prototype.connected = function() {
    console.log("connected");
};

$("#login").submit(function(form) {

    var jid = form.target.elements[0].value;
    var pw  = form.target.elements[1].value

    if (jid == '' || pw == '') {
        // show some error
    } else {

        var client = new Client(config);
        client.login(jid, pw);

    }

    return false;
});