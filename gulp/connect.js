"use strict";

const conf = require("./conf");
const connect = require("gulp-connect");
const gulp = require("gulp");

gulp.task("connect", function () {
	connect.server({
		livereload: true,
		root: conf.paths.docs
	});
});
