module.exports = {
  // external: ['http://code.jquery.com/jquery-2.0.3.js'], // i.e. jQuery
  test: function (sandbox, window, document) {

    // simulate a user search
    sandbox.write('input[name=q]', 'hello world').then(
      function(sandbox, window, document){
        // prepare for the next page on submit
        sandbox.onload = function(sandbox, window, document) {
          var href = sandbox.query(
            // Kindle Fire HD Silk browser has very outdated version of Google
            sandbox.navigator.kind == 'Silk' ?
              'div > a:first-child' : 'h3.r > a'
          ).href;
          // clean up the link if it's a query
          if (/\?q=/.test(href)) {
            href = href.slice(href.indexOf('?q=') + 3).split('&')[0];
          }
          // inject from external domain
          sandbox.loadFromDifferentDomain(href).then(sandbox.done);
        };

        // find the submit and trigger it
        var node = sandbox.query('form button[type=submit]');
        // Mobile uses this
        if (node) {
          sandbox.dispatch(node, 'click');

          // iPad will not change href, no onload will be fired
          if (sandbox.navigator.kind == 'iPad') {
            setTimeout(
              sandbox.onload, 2000,
              sandbox, window, document
            );
          }
        }
        // Desktop / Kindle Fire uses this
        else {
          sandbox.query('form').submit();
        }
      }
    );
  }
};