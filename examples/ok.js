// it should do nothing but showing OK
module.exports = {
  path: 'about:blank',
  test: function(sandbox, window, document) {
    sandbox.done();
  }
};