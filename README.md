testardo
===============================================================
  a browser and OS agnostic web driver for mobile and desktop


### in a nutshell
Bored to death to swipe around in order to be sure device X still work? If so, give _testardo_ a chance!

_testardo_ is the easiest way to test your local projects with some remote service testing capabilities too.
You can be notified if something goes wrong, you can change tests at runtime and have an instant update for all running devices, you can forget SDK, special softwares, drivers, patches and fixes ... you create the test with everything you know and need already with the ability to include libraries and utilities at runtime.


### how to
To use _testardo_ ... all you need is the [testardo](build/testardo) file. Grab it or simply install it via `npm install -g testardo`.

The executable will create a testing environment showing the URL to load through your device browser.
As long as your Mac/Linux machine is reachable through the same network there's really nothing else to do.

If you want to have an idea of _testardo_ options at launch time, please check the [how-to](src/server/how-to.js) file.


### compatibility
So far, _testardo_ has been tested with the following browsers:

  * webOS (the one for the old palm pre, not yet LG TVs)
  * Windows Phone 7 and greater
  * Blackberry 10
  * Firefox OS 1.0 and greater
  * Android 2.3 and greater
  * iOS 7
  *

Above list will change as soon as new devices will be tested.


### why
Selenium is cool but there's no selenium for platforms different from Android and iOS.
This makes integration tests extremely painful for all other phones, both newer and older.

_testardo_ would like to simplify one-shot or infinitely repeated integration tests with any browser you would like to test.