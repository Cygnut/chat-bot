const s = require('../Subbot');
const dgram = require('dgram');

function UdpSubbot()
{
    s.Subbot.call(this, { name: 'udp', description: "Dumps udp on receipt at a specified port." });
    
    this.listener = null;
}

UdpSubbot.prototype = Object.create(s.Subbot.prototype);

UdpSubbot.prototype.getTests = function()
{
    return [];
}

UdpSubbot.prototype.createListener = function(port)
{
    var listener = dgram.createSocket('udp4');
    
    listener.on('error', function(err) {
        console.log('UdpSubbot: Error: ' + err.stack);
        listener.close();
    }.bind(this));
    
    listener.on('message', function(msg, rinfo) {
        console.log('UdpSubbot: Got: ' + msg + ' from ' + rinfo.address + ':' + rinfo.port);
    }.bind(this));
    
    listener.on('listening', function() {
        var address = listener.address();
        console.log('UdpSubbot: Listening at ' + address.address + ':' + address.port);
    }.bind(this));
    
    listener.unref();        // Prevent this object from stopping the entire application from shutting down.
    
    listener.bind(port);
    
    return listener;
}

UdpSubbot.prototype.stop = function()
{
    try
    {
        if (this.server)
        {
            this.server.close();
            this.server = null;
        }
    }
    catch (err)
    {
        console.log('UdpSubbot: Error while stopping ' + err);
        this.server = null;
    }
}

UdpSubbot.prototype.onNewMessage = function(msg) 
{
    if (!msg.directed) return;
    
    if (msg.content.startsWith('listen'))
    {
        var portStr = msg.content.substring(7);
        var port = parseInt(portStr);
        if (isNaN(port))
        {
            this.send(portStr + ' is not a valid port number.', msg.from);
            return;
        }
        
        try
        {
            this.stop();
            this.listener = this.createListener(port);
            this.send('Now listening on ' + port, msg.from);
        }
        catch (err)
        {
            console.log('UdpSubbot: Error while starting to listen on ' + port + ' ' + err);
        }
    }
    else if (msg.content.startsWith('stop'))
        this.stop();
}

module.exports = UdpSubbot;