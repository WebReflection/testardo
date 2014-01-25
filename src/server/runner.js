// starts the server in the very first available PORT
// incrementally trying until it can start on the specified IP
(function startServer() {
  http.createServer(server).on('error', startServer).listen(PORT++, IP, function() {
    // show possible WiFi interfaces during startup
    var interfaces = os.networkInterfaces(),
        show = [];
    Object.keys(interfaces).forEach(
      function(key){
        interfaces[key].forEach(this, [key]);
      },
      function(obj){
        var networkwInterface = this[0];
        if (
          // not an internal interface
          !obj.internal &&
          // right now easier to reach through the network/url bar
          obj.family === 'IPv4' &&
          // either WiFi in Mac or Linux
          /^en[0-9]\d*|wlan\d+$/.test(networkwInterface)
        ) {
          // put this as possible reachable url for testing
          show.push(networkwInterface + ': http://' + obj.address + ':' + (PORT - 1) + '/$');
        }
      }
    );
    show.push('');
    // show what has been found
    process.stdout.write(show.join('\n'));
  });
}());