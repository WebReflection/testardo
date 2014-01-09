var
  http = require('http'),
  fs = require('fs'),
  path = require('path'),
  os = require('os'),
  EOL = os.EOL || '\n',
  // which IP for the current server + proxy ?
  IP = process.env.IP || '0.0.0.0',
  // which port is for testardo ?
  PORT = process.env.PORT || 7357,
  // which host/domain name ?
  HOST = process.env.HOST || 'localhost',
  // which server port to mirror/proxy via testardo ?
  MIRROR = process.env.MIRROR || 80,
  // how long before each file can timeout ?
  TIMEOUT = Math.max(0, parseInt(process.env.TIMEOUT || 0, 10)) || 30000,
  // who should be notified in case of failure ?
  EMAIL = process.env.EMAIL || '',
  // should it loop forever or not ?
  DONT_LOOP = /^false|0$/.test(process.env.LOOP || 1),
  FULL_HOST = HOST + ':' + MIRROR,
  // recycled options object per each proxy request
  options = {
    host: HOST,
    port: MIRROR,
    path: ''
  },
  // recycled headers for entry page
  html = {"Content-Type": "text/html"},
  // what to do once loaded
  onload = function(response) {
    response.headers['x-frame-options'] = 'ALLOWALL';
    response.headers['x-xss-protection'] = 0;
    // send same status and headers
    this.response.writeHead(response.statusCode, response.headers);
    /*
    this.response.addTrailers({
      'x-frame-options': 'ALLOWALL',
      'x-xss-protection': 0
    });
    //*/
    // pipe the whole response to the current one
    response.pipe(this.response);
  },
  // entry point, the root of the project
  main = /^\/\$/,
  // occurred errors
  error = /^\/\!/,
  // everything fine
  allgood = /^\/\*/,
  // external url
  external = /^\/%3C%3C%3C/,
  // strip out beginning of this file and server related stuff
  fn = /^#[^\n\r]+|\/\*(server)[^\x00]*?\1\*\//g
;

function emptyPage(response, exit) {
  response.writeHead(200, html);
  response.end('');
  if (exit) {
    process.nextTick(process.exit.bind(process, 0));
  }
}

// the proxy server
function server(req, response){
  if (main.test(req.url)) {
    response.writeHead(200, html);
    response.end('<!DOCTYPE html>'.concat(
      '<title>testardo@', FULL_HOST, '</title>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0">',
      '<style>*{zoom:1;border:0;margin:0;padding:0;width:100%;height:100%;font-size:0;line-height:0;}</style>',
      '<script>', fs.readFileSync(__filename, 'utf-8').toString().replace(fn, ''), EOL,
        '$.tests=', JSON.stringify(tests), ';', EOL,
        '$.timeout=', TIMEOUT, ';', EOL,
        '$.loop=', !DONT_LOOP,
      ';</script>',
      '<script>document.write(',
        '"<iframe src=\\"" + ',
          'location.href.split("$").join("")',
        ' + "\\" onload=\\"',
          '$(window)',
        '\\"></iframe>"',
      ')</script>'
    ));
  } else if(error.test(req.url)) {
    var body = JSON.parse(unescape(req.url.slice(2))).join(EOL);
    process.stderr.write(body);
    // in case there is an email notification
    // it stops the process so no spam will occur
    emptyPage(response, EMAIL ? true : DONT_LOOP);
    if (EMAIL) {
      var mail = require('child_process').spawn('mail', [
        '-s',
        '[testardo] ' + FULL_HOST,
        EMAIL
      ], {
        cwd: process.cwd(),
        env: process.env,
        detached: true,
        stdio: [
          'pipe', 'pipe', 'pipe'
        ]
      })
        .on(
          'close',
          // always exit with code 1
          process.exit.bind(process, 1)
        )
      ;
      mail.unref();
      mail.stdin.write(
        body, null, mail.stdin.end.bind(mail.stdin)
      );
    }
  } else if(allgood.test(req.url)) {  
    console.log('[OK] ' + req.headers['user-agent']);
    emptyPage(response, DONT_LOOP);
  } else if(external.test(req.url)) {
    http.get(require('url').parse(
      decodeURIComponent(req.url.slice(10))
    ), onload).response = response;
  } else {
    options.path = req.url;
    options.headers = req.headers;
    http.get(options, onload).response = response;
  }
}

(function startServer() {
  http.createServer(server).on('error', startServer).listen(PORT++, IP, function() {
    // show possible WiFi interfaces during startup
    var interfaces = os.networkInterfaces(),
        show = [];
    Object.keys(interfaces).forEach(
      function(key){
        interfaces[key].forEach(this, key);
      },
      function(obj){
        if (
          !obj.internal &&
          obj.family === 'IPv4' &&
          /^en[1-9]\d*|wlan\d+$/.test(this)
        ) {
          show.push(this + ': http://' + obj.address + ':' + (PORT - 1) + '/$');
        }
      }
    );
    show.push('');
    process.stdout.write(show.join('\n'));
  });
}());