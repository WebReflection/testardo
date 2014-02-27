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
  SHOW_SUCCESS = /^true|1$/.test(process.env['SHOW_SUCCESS']),
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

  // recycled headers for local libraries
  js = {"Content-Type": "application/javascript"},

  // all UA that failed the test
  failures = Object.create(null),

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

  onerror = function () {
    if (!favicon.test(this.path)) {
      process.stderr.write(this.path);
      console.log(EOL);
    }
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
  externalURI = /^https?:\/\//,
  // strip out beginning of this same file and server related stuff
  // this is used to write inline testardo client to the browser
  fn = /^#[^\n\r]+|\/\*(server)[^\x00]*?\1\*\//g,
  // by default browsers want this file
  favicon = /^\/favicon\.ico/
;

// simply send an empty page and exit the process if necessary
function emptyPage(response, exit) {
  response.writeHead(200, html);
  response.end('');
  if (exit) {
    process.nextTick(process.exit.bind(process, 0));
  }
}

// sends an email with error or FIXED! info
function sendEmail(body) {
  // note: be sure mail is configured properly
  // send an email with all possible infos
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
  });
  // what to do once the email has been sent
  mail.on('close', function(code) {
    // show something in the console
    if (code) {
      console.log('[WARNING] unable to send email via ' + EMAIL);
    } else if (SHOW_SUCCESS) {
      console.log('notification sent to ' + EMAIL);
    }
    // in case it should not loop ...
    if (DONT_LOOP) {
      // ... simply exit
      process.exit(1);
    }
  });
  // detach this process ...
  mail.unref();
  // ... and write the content
  mail.stdin.write(
    body, null, mail.stdin.end.bind(mail.stdin)
  );
}

// the server callback, invoked per each request
function server(req, response){
  var UA = req.headers['user-agent'],
      body, mail;
  // root page will create the `testardo` environment for the client browser
  if (main.test(req.url)) {
    response.writeHead(200, html);
    response.end(req.method == 'HEAD' ? '' : '<!DOCTYPE html>'.concat(
      '<title>testardo@', FULL_HOST, '</title>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=0">',
      '<style>*{zoom:1;border:0;margin:0;padding:0;width:100%;height:100%;font-size:0;line-height:0;}</style>',
      '<iframe src="about:blank"></iframe>',
      // it includes `testardo` itself to offer a zero-config solution
      '<script>', fs.readFileSync(__filename, 'utf-8').toString().replace(fn, ''), EOL,
        // pre fetch all tests for the browser
        '$.tests=', JSON.stringify(tests), ';', EOL,
        // specify the global timeout
        '$.timeout=', TIMEOUT, ';', EOL,
        // specify if it should loop forever
        '$.loop=', !DONT_LOOP, ';', EOL,
        // initialize testardo on the client side
        'this.onload=$;',
      '</script>'
    ));
  } else if(error.test(req.url)) {
    // something went wrong ... grab sent info
    body = JSON.parse(unescape(req.url.slice(2))).join(EOL);
    // send them to the stderr
    process.stderr.write(body);
    // new line for cleaner terminal output
    console.log(EOL);
    // in case there is an email notification
    // and it has not been nitified already
    if (EMAIL && !failures[UA]) {
      // flag the UA as already notified
      failures[UA] = true;
      // release the browser, do not exit now regardless
      emptyPage(response, false);
      // send the email with the error
      sendEmail(body);
      // sendEmail will eventually exit after
    } else {
      // no email to send, keep testing
      emptyPage(response, DONT_LOOP);
    }
  } else if(allgood.test(req.url)) {
    // eventually show which UA made it
    if (SHOW_SUCCESS) {
      console.log('[OK] ' + UA);
    }
    // tests are fixed now, or it was a flakey one
    // send a "green" email if necessary
    if (EMAIL && failures[UA]) {
      // clean current UA
      delete failures[UA];
      // release the browser, do not exit now
      emptyPage(response, false);
      // send the email with the achievement
      sendEmail('FIXED!');
    } else {
      // release the request and eventually exit
      emptyPage(response, DONT_LOOP);
    }
  } else if(external.test(req.url)) {
    body = decodeURIComponent(req.url.slice(10));
    if (externalURI.test(body)) {
      // requesting an external URL or library
      // TODO:  think about caching these requests on the server too
      //          - pros: less bandwidth used
      //          - cons: no updated content when/if necessary
      //          - how:  probably a <<* instead of <<< to force download?
      http
        .get(url.parse(body), onload)
        .on('error', onerror)
        .response = response
      ;
    } else {
      if (fs.existsSync(body)) {
        response.writeHead(200, js);
        response.end(fs.readFileSync(body, 'utf-8'));
      } else {
        process.stderr.write('unable to read ' + body);
        console.log(EOL);
      }
    }
  } else {
    // any other request will be proxied to the MIRROR port
    options.path = req.url;
    options.headers = req.headers;
    http.get(options, onload).on('error', onerror).response = response;
  }
}