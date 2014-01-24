// it should do nothing but showing OK
module.exports = {
  path: 'about:blank',
  external: ['http://code.jquery.com/jquery-2.0.3.js'],
  test: function(sandbox, window, document) {
    var $ = window.jQuery;
    sandbox.done();
  }
};