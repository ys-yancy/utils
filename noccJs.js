var noccJs = (function() {
	var deferreds = [],
		len = 0;

	var isArray = function(arr) {
		return (arr instanceof Array);
	}

	// 并行加载js
	var load = function(urls) {
		if (!isArray(urls))
			throw new Error('the arguments must is array');

		urls.forEach(function(url) {
			deferreds(_loadScript(url));
		});

		return Promise.all(deferreds);
	}

	return {
		load
	}
})()

var _loadScript = (function() {
	var script = document.createElement('SCRIPT');
	if (script.readyState) { // IE
		return function(url) {
			return new Promise(function(resolve, reject) {
				script = document.createElement('SCRIPT');
				script.src = url;
				document.body.appendChild(script);
				script.onreadystatechange = function() {
					if (script.readyState == "loaded" ||
						script.readyState == "complete") {
						script.onreadystatechange = null;
						resolve();
					}
				}
			})
		}
	} else {
		return function(url) {
			return new Promise(function(resolve, reject) {
				script = document.createElement('SCRIPT');
				script.src = url;
				document.body.appendChild(script);
	            script.onload = function() {
	                resolve();
	            };
			});
		}
	}
})();
