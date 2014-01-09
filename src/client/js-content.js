// --- INTERNAL USE ONLY ---

/** @description
 * if a test contains an `external` propery as string
 * or as Array of strings, these will be injected in the page
 * before the test will be executed.
 * Handy specially with tests helpers able to deal with the DOM
 * in a simplified way than native API would offer (jQuery or such)
 */

// holds all external libraries so these will be
// downloaded only once
var JSContent = {};

// ask the server to download the source of the library
// throws if the returned status is not in range 200-399
function downloadJSContent(src) {
  var xhr = XHR();
  xhr.open('GET', '/' + encodeURIComponent('<<<' + src), false);
  xhr.send(null);
  if (!/^(?:2|3)\d{2}$/.test(xhr.status)) {
    throw new Error('unable to downlaod src');
  }
  return xhr.responseText;
}

// populate an array of urls with relative content per each url
function grabJSContent(libraries) {
  for(var i = 0, src; i < libraries.length; i++) {
    src = libraries[i];
    libraries[i] = JSContent[src] || (
      JSContent[src] = downloadJSContent(src)
    );
  }
  return libraries;
}