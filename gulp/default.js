"use strict";

import gulp from "gulp";
import runSequence from "gulp4-run-sequence";

const task = (callback) => {
	// The "clean" task has been removed because it doesn't work well with gulp4-run-sequence.
	runSequence("images", "scripts", "styles", "node_modules", callback);
};

gulp.task("default", task);

export default task;
