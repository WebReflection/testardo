var // dependencies
  http = require('http'),
  fs = require('fs'),
  os = require('os'),
  path = require('path'),
  url = require('url'),
  // end of line
  EOL = os.EOL || '\n',
  // which IP for the current server + proxy ?
  IP = process.env.IP || '0.0.0.0',
  // which port is for testardo ?
  PORT = process.env.PORT || 7357,
  // which host/domain name ?
  HOST = process.env.HOST || 'localhost',
  // which server port to mirror/proxy via testardo ?
  MIRROR = process.env.MIRROR || 80,
  // how long before each test should timeout ?
  // note:  if specified inside the test as timeout property
  //        that value will be used instead
  TIMEOUT = Math.max(0, parseInt(process.env.TIMEOUT || 0, 10)) || 30000,
  // should it loop forever or not ?
  DONT_LOOP = /^false|0$/.test(process.env.LOOP || 1),
  // who should be notified in case of failure ?
  // note:  this might affect DONT_LOOP too in order to avoid
  //        multiple/reduntant emails for the same error and the same failure
  EMAIL = process.env.EMAIL || '',
  // internal shortcut
  FULL_HOST = HOST + ':' + MIRROR,
  // recycled options object per each proxy request
  options = {
    host: HOST,
    port: MIRROR,
    path: '',
    headers: null
  },
  // recycled headers for entry page
  html = {"Content-Type": "text/html"},

  // what to do once loaded
  onload = function(response) {
    // simplify browser and tests life via cross frame access
    response.headers['x-frame-options'] = 'ALLOWALL';
    response.headers['x-xss-protection'] = 0;
    // send same status and headers
    this.response.writeHead(response.statusCode, response.headers);
    // pipe the whole response to the current one
    response.pipe(this.response);
  },

  // --- SPECIAL OPERATIONS ---

  // entry point, the root of the project
  // i.e. http://0.0.0.0:7357/$
  //      will show the main test page
  main = /^\/\$/,
  // occurred errors, handled behind the scene
  error = /^\/\!/,
  // everything fine, handled behind the scene
  allgood = /^\/\*/,
  // external url, used for libraries and exeternal domains
  // note:  right now it will fail with https requests
  // TODO:  it should probably not
  external = /^\/%3C%3C%3C/,
  // strip out beginning of this same file and server related stuff
  // this is used to write inline testardo client to the browser
  fn = /^#[^\n\r]+|\/\*(server)[^\x00]*?\1\*\//g
;

// simply send an empty page and exit the process if necessary
function emptyPage(response, exit) {
  response.writeHead(200, html);
  response.end('');
  if (exit) {
    process.nextTick(process.exit.bind(process, 0));
  }
}

// the server callback, invoked per each request
function server(req, response){
  // root page will create the `testardo` environment for the client browser
  if (main.test(req.url)) {
    response.writeHead(200, html);
    response.end('<!DOCTYPE html>'.concat(
      '<title>testardo@', FULL_HOST, '</title>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0">',
      '<style>*{zoom:1;border:0;margin:0;padding:0;width:100%;height:100%;font-size:0;line-height:0;}</style>',
      // it includes `testardo` itself to offer a zero-config solution
      '<script>', fs.readFileSync(__filename, 'utf-8').toString().replace(fn, ''), EOL,
        // pre fetch all tests for the browser
        '$.tests=', JSON.stringify(tests), ';', EOL,
        // specify the global timeout
        '$.timeout=', TIMEOUT, ';', EOL,
        // specify if it should loop forever
        '$.loop=', !DONT_LOOP,
      ';</script>',
      // create the iframe without special chars
      '<script>document.write(',
        '"<iframe src=\\"" + ',
          'location.href.split("$").join("")',
        ' + "\\" onload=\\"',
          // initialize testardo on the client side
          '$(window)',
        '\\"></iframe>"',
      ')</script>'
    ));
  } else if(error.test(req.url)) {
    // somethong went wrong ... grab sent info
    var body = JSON.parse(unescape(req.url.slice(2))).join(EOL);
    // send them to the stderr
    process.stderr.write(body);
    // new line for cleaner terminal output
    console.log(EOL);
    // in case there is an email notification
    // it stops the process so no spam will occur
    emptyPage(response, EMAIL ? true : DONT_LOOP);
    if (EMAIL) {
      // be sure mail is configured properly
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
    // show the success in the terminal
    console.log('[OK] ' + req.headers['user-agent']);
    // release the request and eventually exit
    emptyPage(response, DONT_LOOP);
  } else if(external.test(req.url)) {
    // requesting an external URL or library
    // TODO:  think about caching these requests on the server too
    //          - pros: less bandwidth used
    //          - cons: no updated content when/if necessary
    //          - how:  probably a <<* instead of <<< to force download?
    http.get(url.parse(
      decodeURIComponent(req.url.slice(10))
    ), onload).response = response;
  } else {
    // any other request will be proxied to the MIRROR port
    options.path = req.url;
    options.headers = req.headers;
    http.get(options, onload).response = response;
  }
}