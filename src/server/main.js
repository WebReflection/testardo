var // dependencies
  http = require('http'),
  https = require('https'),
  fs = require('fs'),
  os = require('os'),
  path = require('path'),
  url = require('url'),
  // end of line
  EOL = os.EOL || '\n',
  // is it HTTPS (any --https flag would do) ?
  HTTPS = !!Object.keys(process.env).filter(function(key){
    return this.test(key);
  }, /^HTTPS(?:_[A-Z]+)*$/).length,
  // which IP for the current server + proxy ?
  IP = process.env.IP || '0.0.0.0',
  // which port is for testardo ?
  PORT = process.env.PORT || 7357,
  // which host/domain name ?
  HOST = process.env.HOST || 'localhost',
  // which server port to mirror/proxy via testardo ?
  MIRROR = process.env.MIRROR || (HTTPS ? 443 : 80),
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
    passphrase: enrichHTTPSOptions('passphrase'),
    pfx: enrichHTTPSOptions('pfx'),
    key: enrichHTTPSOptions('key', [
      '-----BEGIN RSA PRIVATE KEY-----',
      'MIICXQIBAAKBgQDLrcjMw8Gcg+jlit75Arz+HnMs/lG4hP5nSBL2H449i+KsQHJz',
      '6EA+uyAqTSwyfhqRMkdLUkYoXAQP4SklMCkaxaBBrd6dem8tT1ckIaA0PfdJYfDC',
      'uKczHG2klnq2/NAw/O33AK58dbtxfSRzFJPMs3gBtt6/UWti4Ilb1aQe9wIDAQAB',
      'AoGBAMoU13iJ9MuUePtd6FJJbDf5AC8w+OXJVhwk/2Mg9eCMrM5YdvYXBb73rDcs',
      'MGC8iyFqMCBENgWPHhyfOlKCURRQxb2u+xWBssbM940NAl0Gie9WzPxw041QmwDQ',
      '0Qqy1aC/Okcz0lbTDbidbnc6fvTV1aC65Pr2+98vgw7cVWlxAkEA5csSTCGCF3vS',
      'nRsVV88MJCZLP2/GgP7CSeMDmLHwTCVr2JmDVa+R/1Dom+kXG3Cr9Q0xCy1RzO4G',
      'OddAOotG+QJBAOLoSjXHPzf48md/8c8vgB9NBc0hlMuY54xMjSxACCb4g1miPh+Z',
      'CKeGZgxHirndJi6GAJYwoI3MLWuqkyM8YW8CQQCU4MhuApeiV1rQ5qchSMd49EZ0',
      'Rxq4oFWIQUgnOcGR0/zXTD5G2YUhgW3y9UU/RfRiw7UupKIGv3/RIaA/TdUhAkBz',
      '2Q0qb9PDDAMW/KfElAfh8z0nAiIp4KM3ak4ZbYe7/d1yAfedwlA81816L3yQcGxy',
      'DFB4XdNbEgeOlMQSlV1ZAkB6NnAfNJDkwwpN2sM3QM4OtvWsWHYO2bFbRGqoOryq',
      'UEACAx5/UdL4MPhUf5oyDOauu/UpV/BqObFLnvunj05O',
      '-----END RSA PRIVATE KEY-----'].join('\n')
    ),
    cert: enrichHTTPSOptions('cert', [
      '-----BEGIN CERTIFICATE-----',
      'MIICfzCCAegCCQD9vawlAR85XjANBgkqhkiG9w0BAQUFADCBgzELMAkGA1UEBhMC',
      'SVQxFTATBgNVBAgTDEdydW1weUxhbmRpYTETMBEGA1UEBxMKR3J1bXB5Q2l0eTEX',
      'MBUGA1UEChMOR3J1bXB5IENhdCBMVEQxDzANBgNVBAMTBkdydW1weTEeMBwGCSqG',
      'SIb3DQEJARYPY2F0LmdAZ21haWwuY29tMB4XDTEzMDkyNjA5NTUyNloXDTM4MDUx',
      'ODA5NTUyNlowgYMxCzAJBgNVBAYTAklUMRUwEwYDVQQIEwxHcnVtcHlMYW5kaWEx',
      'EzARBgNVBAcTCkdydW1weUNpdHkxFzAVBgNVBAoTDkdydW1weSBDYXQgTFREMQ8w',
      'DQYDVQQDEwZHcnVtcHkxHjAcBgkqhkiG9w0BCQEWD2NhdC5nQGdtYWlsLmNvbTCB',
      'nzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAy63IzMPBnIPo5Yre+QK8/h5zLP5R',
      'uIT+Z0gS9h+OPYvirEByc+hAPrsgKk0sMn4akTJHS1JGKFwED+EpJTApGsWgQa3e',
      'nXpvLU9XJCGgND33SWHwwrinMxxtpJZ6tvzQMPzt9wCufHW7cX0kcxSTzLN4Abbe',
      'v1FrYuCJW9WkHvcCAwEAATANBgkqhkiG9w0BAQUFAAOBgQA9c1UF2lbYGlNFruMO',
      'd47scNsZBkSSnRRMSloNhO2KIOhRA57WjFk9b0XmCe1gQuNlEWVHf+HZv/Xet8+9',
      'LRhImq4KAG5R+z3TjBrtI/yrVWEzNk+mnygRvsX6MoDKNDbzE6y87tviBUxNgAWB',
      'r/pX8MbqC5NpbLys0A1cpm9tRw==',
      '-----END CERTIFICATE-----'
    ].join('\n')),
    ca: enrichHTTPSOptions('ca', [
      '-----BEGIN CERTIFICATE REQUEST-----',
      'MIIBxDCCAS0CAQAwgYMxCzAJBgNVBAYTAklUMRUwEwYDVQQIEwxHcnVtcHlMYW5k',
      'aWExEzARBgNVBAcTCkdydW1weUNpdHkxFzAVBgNVBAoTDkdydW1weSBDYXQgTFRE',
      'MQ8wDQYDVQQDEwZHcnVtcHkxHjAcBgkqhkiG9w0BCQEWD2NhdC5nQGdtYWlsLmNv',
      'bTCBnzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEAy63IzMPBnIPo5Yre+QK8/h5z',
      'LP5RuIT+Z0gS9h+OPYvirEByc+hAPrsgKk0sMn4akTJHS1JGKFwED+EpJTApGsWg',
      'Qa3enXpvLU9XJCGgND33SWHwwrinMxxtpJZ6tvzQMPzt9wCufHW7cX0kcxSTzLN4',
      'Abbev1FrYuCJW9WkHvcCAwEAAaAAMA0GCSqGSIb3DQEBBQUAA4GBAJJv/mdIboZH',
      'fZIEz0pw2vmKhpceoiXhz7HTllFZ/om/msAPRA5V0kyXEZJ32YIUBv2MR6cHtoHQ',
      'vag7cw+GifXSgyT8loDG2dAjvWtiFXXGKN6YnkJW6iXOHDVo5ETdaJCI3pUhHVSB',
      'GGtjL91MJhEmB6q7SDNfaBroQ9UYAu4C',
      '-----END CERTIFICATE REQUEST-----'
    ].join('\n')),
    ciphers: enrichHTTPSOptions('ciphers'),
    headers: null,
    host: HOST,
    port: MIRROR,
    path: ''
  },
  // recycled headers for entry page
  html = {
    "Content-Type": "text/html",
    headers: addCORS({})
  },

  // recycled headers for local libraries
  js = {
    "Content-Type": "application/javascript",
    headers: addCORS({})
  },

  // all UA that failed the test
  failures = Object.create(null),

  // what to do once loaded
  onload = function(response) {
    // send same status and headers
    this.response.writeHead(
      response.statusCode,
      addCORS(response.headers)
    );
    // pipe the whole response to the current one
    response.pipe(this.response);
  },

  onerror = function (err) {
    if (!favicon.test(this.path)) {
      process.stderr.write(this.path);
      console.log(EOL);
      console.error(err);
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
  favicon = /^\/favicon\.ico/,
  // which proxy ?
  proxy = HTTPS ? https : http
;

if (options.ca) options.ca = [options.ca];
if (HTTPS) process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// enrich headers with CORS evilness
function addCORS(headers) {
  // simplify browser and tests life via cross frame access
  headers['x-frame-options'] = 'ALLOWALL';
  headers['x-xss-protection'] = 0;
  headers['access-control-allow-origin'] = '*';
  return headers;
}

// used to set SSH options 
function enrichHTTPSOptions(key, dflt) {
  key = 'HTTPS_' + key.toUpperCase();
  var value = process.env[key];
  if (value && value != 1 && /^[^-----]/.test(value) && fs.existsSync(value)) {
    value = fs.readFileSync(body, 'utf-8');
  }
  return (value == 1 ? dflt : value) || null;
}

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
      '<iframe ',
        'sandbox="allow-same-origin allow-top-navigation allow-forms allow-scripts" ',
        'src="about:blank"',
      '></iframe>',
      // it includes `testardo` itself to offer a zero-config solution
      '<script>', fs.readFileSync(__filename, 'utf-8').toString().replace(fn, ''), EOL,
        // pre fetch all tests for the browser
        '$.tests=', JSON.stringify(tests), ';', EOL,
        // specify the global timeout
        '$.timeout=', TIMEOUT, ';', EOL,
        // specify if it should loop forever
        '$.loop=', !DONT_LOOP, ';', EOL,
        // is it simulating HTTPS ?
        '$.HTTPS=', HTTPS, ';', EOL,
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
      proxy
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
    if (!HTTPS) {
      options.headers = req.headers;
    }
    options.path = req.url;
    proxy
      .get(options, onload)
      .on('error', onerror)
      .response = response
    ;
  }
}