// node examples/post.js
// testardo --host=0.0.0.0 --mirror=7457 examples/post.js
if (typeof process !== 'undefined') {
  require('http').createServer(function (req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Request-Method': '*'
    });
    res.end(req.method);
  }).listen(7457, '0.0.0.0');
} else {
  module.exports = {
    path: '/',
    test: function(sandbox, window, document) {
      sandbox.onload = function (sandbox, window, document) {
        if (!/POST/.test(document.documentElement.innerHTML)) {
          throw 'did NOT post';
        }
        sandbox.done();
      };
      document.documentElement.innerHTML = [
        '<!DOCTYPE html>',
        '<form method="post" action="?post">',
          '<input name="test" value="',
            Math.random(),
          '">',
          '<input id="submit" type="submit">',
        '</form>'
      ].join('');
      setTimeout(function () {
        sandbox.dispatch('#submit', 'click');
      }, 1000);
    }
  };
}