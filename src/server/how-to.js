// basic info about testardo executable and modules
// it shows and exits if no test has been specified
if (!tests.length) {
  console.log([
    '',
    ' [1] program launch',
    '',
    ' testardo [options] test.js',
    ' testardo [options] dir',
    ' testardo [options] test1.js dir2 test3.js',
    '',
    '   --ip=0.0.0.0      the ip address to use. by default reachable through the network',
    '   --port=7357       which port should be used to run tests. i.e. http://0.0.0.0:7357/',
    '   --host=localhost  the host name. it could be a remote address too',
    '   --mirror=80       the port to mirror in the host. The usual/default webserver port',
    '   --timeout=30000   global test timeout in milliseconds',
    '   --email=me@you.us if specified, sends an email with errors/fixes notifications',
    '   --loop=1          if 0 or false, it exists after first execution',
    '   --show-success=0  if 1 or true, it shows all successful attempts',
    '   --wifi-only=0     if 1 or true, it shows only en1+ or wlan ignoring en0 in Mac',
    '   --force-host=0    if 1 or true, tries to set the specific HOST wen headers are available',
    '',
    '',
    ' [2] test content',
    '',
    ' module.exports = {',
    '   timeout: 0        optional test timeout, overrides the global one if specified',
    '   external: []      optional external script to inject before the test is executed',
    '   path: "/"         optional path to start with the current test',
    '   test: callback    the test to run. The callback will receive the following arguments:',
    '     - sandbox       the main test utility',
    '     - window        the window of the test page',
    '     - document      a shortcut to window.document',
    ' };',
    '',
    ' module.exports = callback;',
    '   - is an simplified way to write a test with no libraries on root path',
    ''
  ].join(require('os').EOL || '\n'));
  process.exit(0);
}