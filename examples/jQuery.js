// basic test for jQuery.ready()
module.exports = {
  path: 'about:blank',
  external: ['http://code.jquery.com/jquery-2.0.3.js'],
  test: function(sandbox, window, document) {
    var $ = window.$;
    $(document).ready(function() {
      sandbox.done();
    });
  }
};