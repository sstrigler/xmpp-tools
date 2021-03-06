//////////////////////
// XMPPTools.CLIENT //
//////////////////////

XMPPTools.Client = function(config) {
    //    this.con = new JSJaCWebSocketConnection({'httpbase': config.httpbase});
    this.con = new JSJaCHttpBindingConnection({'httpbase': config.httpbase});
    this.con.registerHandler('onconnect', JSJaC.bind(this.connected, this));
    this.con.registerHandler('onerror', function(error) {
        XMPPTools.utils.debug(error);
        switch ($(error).attr('code')) {
        case '503':
            $('<div class="alert alert-danger">Service unavailable</div>').prependTo('.mybox');
            break;
        case '401':
            $('<div class="alert alert-danger">Authorization failed</div>').prependTo('.mybox');
            break;
        }
        $('#login button').button('reset');
    });
};

XMPPTools.Client.prototype.connected = function() {
    $('#login').hide();
    $('.lead').hide();
    $("nav").show();

    this.queryNode(this.con.domain);
};

XMPPTools.Client.prototype.login = function(jid, pw) {
    var domain = jid.substring(jid.indexOf('@')+1);
    var username = jid.substring(0, jid.indexOf('@'));
    this.con.connect(
        { 'username': username,
          'domain'  : domain,
          'password': pw
        }
    );
};

XMPPTools.Client.prototype.logout = function() {
    this.con.disconnect();
};

XMPPTools.Client.prototype.query = function(jid, node, ns, cb) {
    var iq = XMPPTools.utils.queryIq(jid, node, ns);
    this.con.sendIQ(
        iq,
        {
            result_handler: function(result) {
                XMPPTools.utils.debug(result.xml());
                cb(result.getNode().firstChild);
            }
        }
    );
};

XMPPTools.Client.prototype.queryNode = function(jid, node, parent) {
    $('.mybox').empty();
    $('#back-button').remove();

    if (parent) {
        var h2 = parent.name || parent.jid;
        $('.mybox').append('<h2>'+h2+'</h2>');
        $("<button>",
          {
              'id'    : "back-button",
              'class' : 'btn btn-lg btn-primary',
              'text'  : "Back",
              'click' : jQuery.proxy(function() {
                  this.queryNode(parent.jid, parent.node, parent.parent);
              }, this)
          }
         ).insertAfter('.mybox');

    } else {
        $('.mybox').append('<h2>'+this.con.domain+'</h2>');
    }

    this.query(
        jid, node, 'http://jabber.org/protocol/disco#info',
        jQuery.proxy(function(result) {
            if ($(result).children().length > 0) {
                $('.mybox').append('<h3>Info</h3>');
                var ul = $("<ul>").appendTo(".mybox");
                $(result).children().each(
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
        }, this)
    );
    this.itemsQueryNode(jid, node, parent);
};

XMPPTools.Client.prototype.discoInfoToString = function(jid, node, info, cb) {
    var tagName = info.tagName;
    info = $(info);
    switch (tagName) {
    case 'identity':
        this.handleDiscoInfoIdentity(
            XMPPTools.utils.attrsToObj(info, ['name', 'category', 'type']), cb);
        break;
    case 'feature':
        this.handleDiscoInfoFeature(
            jid, node, XMPPTools.utils.attrsToObj(info, ['var']), cb);
        break;
    }
};

XMPPTools.Client.prototype.handleDiscoInfoIdentity = function(identity, cb) {
    if (identity.name)
        cb(identity.category + ' ('+identity.type+'): ' + identity.name);
};

XMPPTools.Client.prototype.handleDiscoInfoFeature = function(jid, node, feature, cb) {
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
            if (jid.indexOf('@') != -1) // it's a client entity
                cb("Last active: " +
                   XMPPTools.utils.secondsToString($(result).attr('seconds')));
            else
                cb("Uptime: " +
                   XMPPTools.utils.secondsToString($(result).attr('seconds')));
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
        XMPPTools.utils.debug(function() {
            query(function(result) {
                XMPPTools.utils.debug(feature['var'] + ': ' + result.xml);
            });
        });
    }
};

XMPPTools.Client.prototype.itemsQueryNode = function(jid, node, parent) {
    this.query(
        jid,
        node,
        'http://jabber.org/protocol/disco#items',
        jQuery.proxy(function(result) {
            if ($(result).children().length == 0) return;
            $('.mybox').append('<h3>Items</h3>');
            $('.mybox').append('<div class="alert alert-info" role="alert">Click to inspect</div>');
            var ul = $("<ul class='nav nav-pills nav-stacked'>").appendTo('.mybox');
            $(result).children().each(jQuery.proxy(function(i, item) {
                var name    = $(item).attr('name');
                var newJid  = $(item).attr('jid');
                var newNode = $(item).attr('node') || '';
                var text    = name || newJid;
                var a = $("<a>", {text: text, href: '#'});
                $("<li>",
                  {
                      jid: newJid,
                      node: newNode,
                      role: 'presentation',
                      click: jQuery.proxy(function(el) {
                          this.queryNode(el.target.getAttribute('jid'),
                                         el.target.getAttribute('node'),
                                         {name: text,
                                          jid: jid,
                                          node:node,
                                          parent:parent});
                      }, this)
                  }).appendTo(ul).append(a);
            }, this));
        }, this)
    );
};
