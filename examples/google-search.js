module.exports = function (sandbox, window, document) {
  sandbox.write('input[name=q]', 'hello world').then(
    function(sandbox, window, document){
      sandbox.onload = function(window, document) {
        var href = this.query('h3.r > a').href;
        // clean up the link if it's a query
        if (/\?q=/.test(href)) {
          href = href.slice(href.indexOf('?q=') + 3).split('&')[0];
        }
        // inject from external domain
        sandbox.loadFromDifferentDomain(href).then(sandbox.done);
      };
      var node = sandbox.query('form button[type=submit]');
      if (node) {
        sandbox.dispatch(
          node,
          'click'
        );
      } else {
        sandbox.query('form').submit();
      }
    }
  );
};