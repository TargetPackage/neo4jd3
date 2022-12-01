"use strict";

import { paths } from "./conf.js";
import connect from "gulp-connect";
import gulp from "gulp";

gulp.task("connect", function () {
	connect.server({
		livereload: true,
		root: paths.docs
	});
});
