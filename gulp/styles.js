"use strict";

import { paths } from "./conf.js";
import cssnano from "gulp-cssnano";
import gulp from "gulp";
import rename from "gulp-rename";
import gulpSass from "gulp-sass";
import nodeSass from "sass";
const sass = gulpSass(nodeSass);

gulp.task("styles", async function () {
	return gulp
		.src(paths.src + "/styles/neo4jd3.scss")
		.pipe(sass()).on("error", sass.logError)
		.pipe(rename({ suffix: ".min" }))
		.pipe(cssnano())
		.pipe(gulp.dest(paths.docs + "/css"))
		.pipe(gulp.dest(paths.dist + "/css"));
});
