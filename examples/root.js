// it should do nothing but showing the root page
module.exports = {
  path: '/',
  test: function(sandbox, window, document) {
    // to visually check everything is fine
    setTimeout(sandbox.done, 5000);
  }
};