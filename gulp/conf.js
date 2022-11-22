"use strict";

/**
 *  This file contains the variables used in other gulp files which defines tasks
 *  By design, we only put there very generic config values which are used in several places to keep good readability of the tasks
 */

const c = require("ansi-colors");
const log = require("fancy-log");

/**
 *  The main paths of your project handle these with care
 */
exports.paths = {
	dist: "dist",
	docs: "docs",
	html: "src/main/html",
	src: "src/main",
	tmp: ".tmp"
};

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
exports.errorHandler = function (title) {
	"use strict";

	return function (err) {
		log(c.red("[" + title + "]"), err.toString());
		this.emit("end");
	};
};
