// it should do nothing but showing OK
module.exports = {
  path: 'about:blank',
  test: function(sandbox, window, document) {
    function getScrollTop() {
      var top = window.top,
          topDocument = top.document,
          body = topDocument.body,
          html = topDocument.documentElement;
      return  document.body.scrollTop ||
              body.scrollTop ||
              html.scrollTop ||
              top.pageYOffset;
    }
    var scrollTop;
    document.body.innerHTML = 'first<br/>' + Array(500).join('test <br/>') + '<div>last</div>';
    setTimeout(function () {
      scrollTop = getScrollTop();
      sandbox.scrollTo('div');
      setTimeout(function () {
        if (scrollTop === getScrollTop()) {
          throw new Error('it did not scroll');
        } else {
          sandbox.done();
        }
      }, 1000);
    }, 1000);
  }
};