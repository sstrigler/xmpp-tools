function debug(some) {
    if (config.debug) {
        if (typeof some == 'function') some();
        else console.log(some);
    }
};

function queryIq(jid, node, namespace) {
    var iq = new JSJaCIQ();
    iq.setTo(jid);
    iq.setType('get')
    var query = iq.setQuery(namespace);
    if (node) {
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

// taken from
// http://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
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
