if (process.argv.length < 3) {
  console.log([
    '',
    ' testardo [options] test.js',
    ' testardo [options] dir',
    ' testardo [options] test1.js dir2 test3.js',
    '',
    '   --ip=0.0.0.0      the ip address to use. by default reachable through the network',
    '   --port=7357       which port should be used to run tests. i.e. http://0.0.0.0:7357/',
    '   --host=localhost  the host name. it could be a remote address too',
    '   --mirror=80       the port to mirror in the host. The usual/default webserver port',
    '   --timeout=30000   each the test timeout in milliseconds',
    ''
  ].join(require('os').EOL || '\n'));
  process.exit(0);
}