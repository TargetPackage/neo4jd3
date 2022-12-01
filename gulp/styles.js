"use strict";

import autoprefixer from "gulp-autoprefixer";
import { paths } from "./conf.js";
import connect from "gulp-connect";
import cssnano from "gulp-cssnano";
import gulp from "gulp";
import rename from "gulp-rename";
import gulpSass from "gulp-sass";
import nodeSass from "sass";
const sass = gulpSass(nodeSass);

gulp.task("styles:build", async function () {
	return sass("src/main/styles/neo4jd3.scss", { style: "expanded" })
		.pipe(autoprefixer("last 2 version"))
		.pipe(gulp.dest(paths.docs + "/css"))
		.pipe(rename({ suffix: ".min" }))
		.pipe(cssnano())
		.pipe(gulp.dest(paths.docs + "/css"))
		.pipe(connect.reload());
});

gulp.task("styles", gulp.series("styles:build"), async function () {
	return gulp
		.src([paths.docs + "/css/neo4jd3.css", paths.docs + "/css/neo4jd3.min.css"])
		.pipe(gulp.dest(paths.dist + "/css"));
});
