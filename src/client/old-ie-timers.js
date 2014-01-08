/*@cc_on
(function(f){
 // @info http://webreflection.blogspot.com/2007/06/simple-settimeout-setinterval-extra.html
 window.setTimeout =f(window.setTimeout);
 window.setInterval =f(window.setInterval);
})(function(f){return function(c,t){var a=[].slice.call(arguments,2);return f(function(){c.apply(this,a)},t)}});
@*/