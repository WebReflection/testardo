module.exports = {
  path: '/',
  test: function (sandbox, window, document) {
    setTimeout(function () {
      sandbox.query('footer').scrollIntoView(true);
      setTimeout(function () {
        sandbox.load('/alunny', function(sandbox, window, document){
          if (sandbox.status == 200) {
            setTimeout(function () {
              sandbox.onload = sandbox.done;
              sandbox.dispatch('div[data-permalink]', 'click');
            }, 2000);
          } else {
            sandbox.error('Unexpected status code: ' + sandbox.status);
          }
        });
      }, 2000);
    }, 2000);
  }
};