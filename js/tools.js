var config = {
    httpbase: '/http-bind/',
    debug: true
};

function debug(some) {
    if (config.debug) {
        if (typeof some == 'function') some();
        else console.log(some);
    }
};

////////////
// CLIENT //
////////////

function Client(config) {
    this.con = new JSJaCHttpBindingConnection({'httpbase': config.httpbase});
    this.con.registerHandler('onconnect', JSJaC.bind(this.connected, this));
};

Client.prototype.connected = function() {
    $('#login').hide();
    $('.lead').hide();

    this.queryNode(this.con.domain)
};

Client.prototype.login = function(jid, pw) {
    var domain = jid.substring(jid.indexOf('@')+1);
    var username = jid.substring(0, jid.indexOf('@'));
    this.con.connect(
        { 'username': username,
          'domain'  : domain,
          'password': pw
        }
    );
};

Client.prototype.logout = function() {
    this.con.disconnect();
};

Client.prototype.queryNode = function(jid, node, parent) {
    $('.mybox').empty();

    if (parent) {
        var h2 = parent.name || parent.jid;
        $('.mybox').append('<h2>'+h2+'</h2>');
    } else {
        $('.mybox').append('<h2>'+this.con.domain+'</h2>');
    }

    var iq = queryIq(jid, node, 'http://jabber.org/protocol/disco#info');

    this.con.sendIQ(
        iq,
        {
            'result_handler': jQuery.proxy(function(result) {
                debug(result.xml());
                if ($(result.getQuery()).children().length > 0) {
                    $('.mybox').append('<h3>Info</h3>');
                    var ul = $("<ul>").appendTo(".mybox");
                    $(result.getQuery()).children().each(
                        jQuery.proxy(
                            function(i, info) {
                                this.discoInfoToString(jid, node, info, function(text) {
                                    $("<li>",
                                      { 'class': 'disco-info',
                                        'text' : text }).appendTo(ul);
                                });
                            },
                            this)
                    );
                }
                this.itemsQueryNode(jid, node, parent);
            }, this),
            'error_handler': jQuery.proxy(function(error) {
                this.itemsQueryNode(jid, node, parent);
            }, this)
        }
    );
};

Client.prototype.discoInfoToString = function(jid, node, info, cb) {
    var tagName = info.tagName;
    info = $(info);
    switch (tagName) {
    case 'identity':
        this.handleDiscoInfoIdentity(
            attrsToObj(info, ['name', 'category', 'type']), cb);
        break;
    case 'feature':
        this.handleDiscoInfoFeature(jid, node, attrsToObj(info, ['var']), cb);
        break;
    }
};

Client.prototype.handleDiscoInfoIdentity = function(identity, cb) {
    if (identity.name)
        cb(identity.category + ' ('+identity.type+'): ' + identity.name);
};

Client.prototype.handleDiscoInfoFeature = function(jid, node, feature, cb) {
    var query = jQuery.proxy(function(specific_callback) {
        this.query(jid, node, feature['var'], specific_callback);
    }, this);

    switch (feature['var']) {
    case 'jabber:iq:time':
        query(function(result) {
            var time = $(result).children('utc').text();
            if (time.indexOf('T') == 8) // fix bad timestamp
                time = time.substr(0,4)+'-'+time.substr(4,2)+'-'+time.substr(6);
            cb('Time: ' + Date.hrTime(time));
        });
        break;
    case 'jabber:iq:last':
        query(function(result) {
            cb("Uptime: " + secondsToString($(result).attr('seconds')));
        });
        break;
    case 'jabber:iq:version':
        query(function(result) {
            cb("Version: " +
               $(result).children('name').text() + ' ' +
               $(result).children('version').text() + ' ' +
               $(result).children('os').text()
              )
        });
        break;
    default:
        debug(function() {query(function(result) {
                debug(feature['var'] + ': ' + result.xml);
            })
        });
    }
};

Client.prototype.query = function(jid, node, ns, cb) {
    var iq = queryIq(jid, node, ns);
    this.con.sendIQ(
        iq,
        {
            result_handler: function(result) {
                debug(result.xml());
                cb(result.getNode().firstChild);
            }
        }
    );
}

Client.prototype.itemsQueryNode = function(jid, node, parent) {
    var iq = queryIq(jid, node, 'http://jabber.org/protocol/disco#items');

    var addButton = jQuery.proxy(function() {
        if (typeof parent != 'undefined') {
            $("<button>",
              {
                  'class': 'btn btn-lg btn-primary',
                  text: "Back",
                  click: jQuery.proxy(function() {
                      this.queryNode(parent.jid, parent.node, parent.parent);
                  }, this)
              }
             ).appendTo('.mybox');
        }
    }, this);

    this.con.sendIQ(
        iq,
        {
            'result_handler': jQuery.proxy(function(result) {
                debug(result.xml());
                if ($(result.getQuery()).children().length == 0) return addButton();
                $('.mybox').append('<h3>Items</h3>');
                $('.mybox').append('<p class="lead">Click to inspect</p>');
                var ul = $("<ul>").appendTo('.mybox');
                $(result.getQuery()).children().each(jQuery.proxy(function(i, item) {
                    var name    = $(item).attr('name');
                    var newJid  = $(item).attr('jid');
                    var newNode = $(item).attr('node') || '';
                    var text    = name || newJid;
                    $("<li>",
                      {
                          text: text,
                          jid: newJid,
                          node: newNode,
                          click: jQuery.proxy(function(el) {
                              this.queryNode(el.target.getAttribute('jid'),
                                             el.target.getAttribute('node'),
                                             {name: text,
                                              jid: jid,
                                              node:node,
                                              parent:parent});
                          }, this)
                      }).appendTo(ul);;
                }, this));
                addButton();
            }, this),
            'error_handler': function() { addButton() }
        }
    );
};

//////////
// MAIN //
//////////

$("#login").submit(function(form) {

    var jid = form.target.elements[0].value;
    var pw  = form.target.elements[1].value;

    if (jid == '' || pw == '') {
        // show some error
    } else {

        var client = new Client(config);
        client.login(jid, pw);

        $(window).unload(function() { client.logout(); });
    }

    return false;
});

/////////////
// HELPERS //
/////////////

function queryIq(jid, node, namespace) {
    var iq = new JSJaCIQ();
    iq.setTo(jid);
    iq.setType('get')
    var query = iq.setQuery(namespace);
    if (typeof node != 'undefined') {
        query.setAttribute('node', node);
    }

    debug(iq.xml());
    return iq;
};

function attrsToObj(el, attrs) {
    return attrs.reduce(function(obj, attr) {
        if (el.attr(attr))
            obj[attr] = el.attr(attr);
        return obj;
    }, {});
};

// taken from http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
function secondsToString(seconds) {
    var str = "";
    var numyears = Math.floor(seconds / 31536000);
    if (numyears)
        str += numyears + " years ";
    var numdays = Math.floor((seconds % 31536000) / 86400);
    if (numdays)
        str += numdays + " days ";
    var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    if (numhours)
        str += numhours + " hours ";
    var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    if (numminutes)
        str += numminutes + " minutes ";
    var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    str += numseconds + " seconds";
    return str
}

//         var skippers = ["muckl@conference.jwchat.org", "jwchat@conference.jwchat.org", "x-berg.de@conference.jwchat.org"];

//         if (skippers.indexOf(jid) != -1) {
//             console.log("skipping "+jid)
//             continue;
//         }
