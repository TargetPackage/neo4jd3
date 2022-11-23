"use strict";

const conf = require("./conf");
const connect = require("gulp-connect");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");

gulp.task("images", function () {
	return gulp
		.src("src/main/images/**/*")
		.pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
		.pipe(gulp.dest(conf.paths.docs + "/img"))
		.pipe(connect.reload());
});
