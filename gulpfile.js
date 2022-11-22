/**
 *  The gulp tasks are split into several files in the gulp directory
 */
"use strict";

const read = require("fs-readdir-recursive");

/**
 *  This will load all js in the gulp directory
 */
read("./gulp")
	.filter(function (file) {
		console.log(file);
		return /\.(js)$/i.test(file);
	})
	.map(function (file) {
		require("./gulp/" + file);
	});
