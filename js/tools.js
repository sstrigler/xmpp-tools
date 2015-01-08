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

    var iq = new JSJaCIQ();
    iq.setIQ('conference.jwchat.org', 'get', 'confiq');
    iq.setQuery('http://jabber.org/protocol/disco#items');

    this.con.sendIQ(iq, {
        'result_handler': JSJaC.bind(function(result) {
            console.log(result.xml());
            var items = result.getQuery().childNodes;
            console.log(items.length);

            var ul = document.createElement('ul');
            $('.jumbotron').append(ul);

            var skippers = ["muckl@conference.jwchat.org", "jwchat@conference.jwchat.org", "x-berg.de@conference.jwchat.org"];

            for (var i=0; i<items.length; i++) {
                var jid = items.item(i).getAttribute('jid');
                if (skippers.indexOf(jid) != -1) {
                    console.log("skipping "+jid)
                    continue;
                }
                var delIq = new JSJaCIQ();
                delIq.setIQ(jid, 'set', 'del_room_'+i);
                var query = delIq.setQuery('http://jabber.org/protocol/muc#owner');
                query.appendChild(document.createElement('destroy'));
                this.con.sendIQ(delIq, {
                    'result_handler': function(delres) {
                        $(ul).append("<li>deleted "+delres.getFrom()+"</li>");
                    },
                    'error_handler': function(error) {
                        $(ul).append("<li>error deleting "+error.getFrom()+"</li>");
                        //console.log(error.xml());
                    }

                });
                //$(ul).append("<li>"+jid+"</li>");
            }
        }, this) // result_handler
    });
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
