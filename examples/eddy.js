// testardo --host=webreflection.github.io --https examples/eddy.js
module.exports = {
  path: '/eddy/',
  test: function($, window, document) {
    $.load('/eddy/test/', function() {
      setTimeout($.done, 1000);
    });
  }
};