# Keep in view

Don't allow elements to scroll out of view by having them stick to the top or bottom of a window of a modern browser.

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/dutchcelt/jquery-fep-keepinview/master/dist/fep-keepinview.min.js
[max]: https://raw.github.com/dutchcelt/jquery-fep-keepinview/master/dist/fep-keepinview.js

In your web page:

	<html>
		<head>
			<script src="fep-keepinview.min.js"></script>
		</head>
		<body>
			... markup ...
			<script>
				(function() {
					FEP.KeepInView( ".myClassSelector" );
					FEP.KeepInView( ".mySecondClassSelector", { zindex:'42', trigger: 'top', cloned: true } );
				})();
			</script>
		</body>
	</html>


## Documentation

Should work as is in IE10+ and the latest Firefox, Chrome and Safari.

For IE9 add a polyfill for [Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame). Paul Irish has post on [improving animation performance](http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/) and you can [download the polyfill as a gist](https://gist.github.com/paulirish/1579671)

If you need IE8 support I suggest you stick to [the jQuery version](https://github.com/dutchcelt/Keep-in-View). 


## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
