"use strict";

const gulp = require("gulp");
const runSequence = require("gulp4-run-sequence");

gulp.task("default", function (callback) {
	// The "clean" task has been removed because it doesn't work well with gulp4-run-sequence.
	runSequence("images", "scripts", "styles", "node_modules", "connect", "watch", callback);
});
