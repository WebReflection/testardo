var
  fs = require('fs'),
  path = require('path'),
  tests = [],
  addTest = function (name) {
    tests.push({
      name: name,
      content: fs.readFileSync(name, 'utf-8').toString()
    });
  }
;

// per each argument ...
process.argv.slice(2).forEach(function(arg){
  // set the environment option, if present
  if (this.re.test(arg)) {
    process.env[RegExp.$1.toUpperCase()] = RegExp.$2;
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
  re: /--([^=]+?)=([^\x00]+)$/,
  filter: function (name) {
    return name.slice(-3) === '.js';
  },
  addTest: function (name) {
    addTest(path.join(this.toString(), name));
  }
});