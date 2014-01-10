// --- PUBLIC / EXPOSED sandbox API ---

/** @description
 * The sandbox object is the main test-suite controller.
 * Most common operations such querying, writing in a field,
 * triggering or creating an event and dispatch it,
 * can be performed through this utility, as well as loading
 * eventually new paths/pages within the current test.
 * However, every test comes with the iframe window and
 * document too, feel free to use this when/if necessary.
 */

var
  sandbox = {
    // simplifies event dispatch
    // accepts a string as selector or directly a node
    // sb.dispatch(cssSelectorOrDOMNode, type[, extendEventViaSuchObject]);
    dispatch: function (nodeOrQuery, typeOrEvent, eventOptions) {
      return dispatch(
        getNode(nodeOrQuery),
        typeof typeOrEvent == 'string' ?
          sandbox.event(typeOrEvent, eventOptions || {}) :
          typeOrEvent
      );
    },
    // attached for convenience to the sandbox
    // makes easier to retrieve them via `this`
    // when/if necessary
    // note:  both window and document will be swapped
    //        once the iframe changes page
    window: window,
    document: document,
    // simplifies event creation for old browsers too
    // accepts optional object used to extend the created event
    // sb.event(type[, extendEventViaSuchObject]);
    event: function (type, options) {
      var e = createEvent(type);
      if (options) {
        e.detail = options;
        for(var key in options) {
          if (options.hasOwnProperty(key)) {
            try {
              e[key] = options[key];
            } catch(o_O) {}
          }
        }
      }
      return e;
    },
    // load another path and invoke a callback, if specified
    // sb.load('/another/path?whatever'[, callback]);
    // it is possible to not specify the callback and use instead
    // sb.load('/newPath').then(callback);
    load: function (href, callback) {
      var xhr = XHR();
      xhr.open('HEAD', href, false);
      xhr.send(null);
      sandbox.status = xhr.status;
      addIframeOnLoad(callback);
      window.location.href = href;
      lastAction = 'load';
      return sandbox;
    },
    // load a page from another host/domain
    // use carefully, not everything canb be loaded as expected
    loadFromDifferentDomain: function(href, callback) {
      sandbox.status = 0;
      addIframeOnLoad(callback);
      window.location.href = '/' + encodeURIComponent('<<<' + href);
      lastAction = 'load';
      return sandbox;
    },
    // exposes some useful info about the navigator
    navigator: {
      // the device kind (iPad, iPod, iPhone, Silk, Android, IEMobile)
      kind: /\b(Android|Asha|IEMobile|iP(?:ad|od|hone)|Silk)\b/.test(navigator.userAgent) ? RegExp.$1 : 'unknown',
      // the OS version
      // https://gist.github.com/WebReflection/7107617#file-navigator-version-js
      version: /(?:(?:OS(?: X)?|Android|Windows(?: NT)) |(?:IEMobile|Version|webOS|Nokia\w+)\/)(\d+)[_.](\d+)(?:[_.](\d+(?:\.\d+)?))?/.test(navigator.userAgent) ?
        {
          major: RegExp.$1,
          minor: RegExp.$2 || '0',
          revision: (RegExp.$3 || '0').replace(/^0\./, ''),
          valueOf: function () {
            return this.major;
          }
        } :
        {}
    },
    // simplifies removeEventListener/detachEvent operation
    // note: it does not fix all edge cases, use external libraries for this
    off: function (nodeOrQuery, type, callback) {
      removeListener(getNode(nodeOrQuery), type, callback);
    },
    // simplifies addEventListener/attachEvent operation
    // note: it does not fix all edge cases, use external libraries for this
    on: function (nodeOrQuery, type, callback) {
      addListener(getNode(nodeOrQuery), type, callback);
    },
    // returns first found element or undefined
    // sb.query("div.cname", optionalParentNode);
    query: function (css, parent) {
      return sandbox.queryAll(css, parent)[0];
    },
    // returns all found elements
    // same signature as sb.query(css[, parent])
    queryAll: NATIVE_SELECTOR ?
      function (css, parent) {
        return (parent || document).querySelectorAll(css);
      } :
      function (css, parent) {
        return queryAll(css, parent);
      }
    ,
    // both sb.load(path) and sb.loadFromDifferentDomain(url)
    // returns the sandbox and if a .then(callback) is used
    // this will be invoked once the iframe has been loaded
    // In case of sb.write() this can be used in a similar way.
    then: function (callback) {
      switch(lastAction) {
        case 'load':
          addIframeOnLoad(callback);
          break;
        case 'write':
          lastCallback = callback;
          break;
      }
    },
    // simulates a user writing in a specific field
    // triggering syntethic keyboard events too
    // this operation will be asynchronous
    // sb.write(cssSelectorOrDOMNode, text, callback);
    // or
    // sb.write(cssSelectorOrDOMNode, text).then(callback);
    write: function (nodeOrQuery, text, callback) {
      for(var
        goOnIfNotPrevented = function (type, options) {
          if (!evt.defaultPrevented) {
            evt = sandbox.dispatch(node, type, options);
          }
        },
        put = function(i) {
          var
            c = chars[i],
            code = c.charCodeAt(0),
            options = {
              charCode: code,
              keyCode: code,
              which: code,
              'char': c,
              key: c
            }
          ;
          goOnIfNotPrevented('keydown', options);
          goOnIfNotPrevented('keypress', options);
          goOnIfNotPrevented('keyup', options);
          if (!evt.defaultPrevented && node.value.length === i) {
            node.value += c;
          }
          if (i === chars.length - 1) {
            setTimeout(
              createCallbackWrap(callback || lastCallback),
              COMMON_DELAY * 3, sandbox, window, document
            );
          }
          evt = {};
        },
        evt = {},
        node = getNode(nodeOrQuery),
        chars = text.split(''),
        i = 0; i < chars.length; i++
      ) {
        setTimeout(put, i * COMMON_DELAY, i);
      }
      lastAction = 'write';
      return sandbox;
    }
  },
  // last performed action
  lastAction = '',
  // last invoked callback
  lastCallback = null
;