testardo
===============================================================
  a browser and OS agnostic web driver for mobile and desktop


Please note this software is at a very basic state ... like a beta version `0.0.7` one.


### in a nutshell
Bored to death to swipe around in order to be sure device X still work? If so, give _testardo_ a chance!

_testardo_ is the easiest way to test your local projects with some remote service testing capabilities too.
You can be notified if something goes wrong, you can change tests at runtime and have an instant update for all running devices, you can forget SDK, special softwares, drivers, patches and fixes ... you create the test with everything you know and need already with the ability to include libraries and utilities at runtime.


### how to
To use _testardo_ ... all you need is the [testardo](build/testardo) file. Grab it or simply install it via `npm install -g testardo`.

The executable will create a testing environment showing the URL to load through your device browser.
As long as your Mac/Linux machine is reachable through the same network there's really nothing else to do.

If you want to have an idea of _testardo_ options at launch time, please check the [how-to](src/server/how-to.js) file, or launch `./testardo` without arguments in your console.

#### Example
A very basic example is shown in [this file](examples/google-search.js).

Write `./testardo --host=74.125.239.35 --loop=0 examples/google-search.js` and connect to the full url shown in the terminal.
This will look something like: `en1: http://192.168.1.146:7357/$` where the full url to connect to will be `http://192.168.1.146:7357/$`


### compatibility
So far, _testardo_ has been tested with the following browsers:

  * iOS 5.1 and greater
  * Android 2.3 and greater
  * Firefox OS 1.0 and greater
  * Windows Phone 7 and greater
  * Blackberry 10
  * Kindle Fire Silk
  * webOS (the one for the old palm pre, not yet LG TVs)

Above list will change as soon as new devices will be tested. Ideally old IE browsers should work too (at some point).


### why
Selenium is cool but there's no selenium for platforms different from Android and iOS.
This makes integration tests extremely painful for all other phones, both newer and older.

_testardo_ would like to simplify one-shot or infinitely repeated integration tests with any browser you would like to test.