// --- INTERNAL USE ONLY ---

var
  // all errors that could occurre per each session
  errors = [],
  // last test file name
  lastFile = '',
  // timer
  timer = 0,
  // save timeout, loop, and tests since window.$ will be removed
  TIMEOUT = $.timeout,
  LOOP = $.loop,
  tests = $.tests
;

// remove traces of this function in the global scope
delete global.$;

setTimeout(function test() {
  // keeps running tests if possible
  // then keep testing 'till the end
  function error(message) {
    errors.push(message);
    tests = [];
    test();
  }
  var // one test per time
    file = tests.shift(),
    // used to notify failures or success
    xhr = XHR(),
    // the temporary test module and its export
    module,
    // the temporary list of dependencies
    libraries
  ;
  // if there was a timer going, drop it
  clearTimeout(timer);
  timer = 0;
  // still tests to run ...
  if (file) {
    // store last file name
    lastFile = file.name;
    // set main sandbox actions through the local scope
    sandbox.error = error;
    sandbox.done = test;
    try {
      // grab the test
      module = {};
      // simulate module load
      Function('window,module', file.content).call(window, window, module);
      // fix the exports if just a function
      if (typeof module.exports === 'function') {
        module.exports = {
          test: module.exports
        };
      }
      // grab external libraries if specified
      if (module.exports.external) {
        libraries = grabJSContent([].concat(module.exports.external));
      }
      // load the path or the root of the project
      sandbox.load(module.exports.path || '/', function () {
        // then ... if there were libraries
        if (libraries) {
          // inject them
          var
            html = document.documentElement,
            script = document.createElement('script'),
            text = libraries.join('\n')
          ;
          script.type = 'text/javascript';
          if ('text' in script) {
            script.text = text;
          } else {
            script.appendChild(document.createTextNode(text));
          }
          html.insertBefore(script, html.lastChild);
          // and drop them to not compromise too much the real page
          html.removeChild(script);
        }
        // setup the timeout using the specified one in the test or the global
        timer = setTimeout(error, module.exports.timeout || TIMEOUT, 'Expired');
        createCallbackWrap(module.exports.test).apply(module.exports, arguments);
      });
    } catch(o_O) {
      // if something went wrong, store the message/error
      error(o_O.message);
    }
  } else if(errors.length) {
    // no more tests but there was one or more errors
    // send all known info to the server
    // TODO:  improve this part either exiting at first error
    //        or directly storing all known info per each error
    xhr.open('GET', '!' + escape(
      JSON.stringify(
        [
          '[file] ' + lastFile,
          '[user] ' + navigator.userAgent
        ].concat(errors)
      )
    ), false);
    xhr.send(null);
  } else {
    // everything OK, tell the server we are good
    xhr.open('GET', '*' + new Date * 1, false);
    xhr.send(null);
    // if necessary ...
    if (LOOP) {
      // run again the test one more time
      // after TIMEOUT milliseconds
      setTimeout(function(){
        top.location.reload();
      }, TIMEOUT);
    }
    // in any case show the green status
    showResult('OK');
  }
}, COMMON_DELAY);