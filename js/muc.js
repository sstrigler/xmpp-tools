function Muc(con) {
    this.con = con;
};

Muc.prototype.getRooms = function(host, cb) {
    var iq = new JSJaCIQ();
    iq.setIQ(host, 'get', 'confiq');
    iq.setQuery('http://jabber.org/protocol/disco#items');

    this.con.sendIQ(
        iq,
        {'result_handler': JSJaC.bind(function(result) {
            var items = result.getQuery().childNodes;
            cb(items);
        })}
    );
};

Muc.prototype.deleteRooms = function(rooms, success_cb, error_cb) {
    for (var i=0; i<rooms.length; i++) {
        var jid = rooms[i];
        var iq = new JSJaCIQ();
        iq.setIQ(jid, 'set');
        var query = delIq.setQuery('http://jabber.org/protocol/muc#owner');
        query.appendChild(document.createElement('destroy'));

        this.con.sendIQ(
            delIq,
            {
                'result_handler': function(res) {
                    success_cb(res.getFrom(), jid);
                },
                'error_handler': function(error) {
                    error_cb(error.getFrom(), jid);
                }
            }
        );
};
