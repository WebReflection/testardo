// all necessary to parse command arguments before any execution
var // dependencies
  fs = require('fs'),
  path = require('path'),
  // the list of tests to run
  tests = [],
  // utility to retrieve a test file content
  grabTest = function (name) {
    return fs.readFileSync(name, 'utf-8').toString();
  },
  // add test info to the tests list
  // it also watches test files and update
  // the content when these changes
  addTest = function (name) {
    fs.watch(name, function(event) {
      if (event == 'change') {
        tests[this].content = grabTest(name);
      }
    }.bind(tests.push({
      name: name,
      content: grabTest(name)
    }) - 1));
  }
;

// per each program extra argument ...
process.argv.slice(2).forEach(function(arg){
  // set the environment option, if present
  if (this.re.test(arg)) {
    // fake constant like bash exported variables
    process.env[
      RegExp.$1.toUpperCase().replace(this.dash, '_')
    ] = RegExp.$3 || 1;
    // if --anyarg has no value it will be truthy by default
    // i.e. ./testardo --loop proj/test.js
  }
  // or grab the file content or any js test in the folder
  else {
    var stats = fs.statSync(arg);
    if (stats.isFile()) {
      addTest(arg);
    } else if(stats.isDirectory(arg)) {
      fs.readdirSync(arg).filter(this.filter).forEach(this.addTest, arg);
    }
  }
}, {
  dash: /-/g,
  re: /--([^=]+?)(=([^\x00]+))?$/,
  // used to filter valid tests ... right now .js files only
  filter: function (name) {
    return name.slice(-3) === '.js';
  },
  // used to add test content and info
  addTest: function (name) {
    addTest(path.join(this.toString(), name));
  }
});