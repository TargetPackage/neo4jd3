"use strict";

import { paths } from "./conf.js";
import connect from "gulp-connect";
import gulp from "gulp";
import imagemin from "gulp-imagemin";

gulp.task("images", function () {
	return gulp
		.src("src/main/images/**/*")
		.pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
		.pipe(gulp.dest(paths.docs + "/img"))
		.pipe(connect.reload());
});
