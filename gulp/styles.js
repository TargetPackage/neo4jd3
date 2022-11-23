"use strict";

const autoprefixer = require("gulp-autoprefixer");
const conf = require("./conf");
const connect = require("gulp-connect");
const cssnano = require("gulp-cssnano");
const gulp = require("gulp");
const rename = require("gulp-rename");
const sass = require("gulp-sass")(require("sass"));

gulp.task("styles:build", async function () {
	return sass("src/main/styles/neo4jd3.scss", { style: "expanded" })
		.pipe(autoprefixer("last 2 version"))
		.pipe(gulp.dest(conf.paths.docs + "/css"))
		.pipe(rename({ suffix: ".min" }))
		.pipe(cssnano())
		.pipe(gulp.dest(conf.paths.docs + "/css"))
		.pipe(connect.reload());
});

gulp.task("styles", gulp.series("styles:build"), async function () {
	return gulp
		.src([conf.paths.docs + "/css/neo4jd3.css", conf.paths.docs + "/css/neo4jd3.min.css"])
		.pipe(gulp.dest(conf.paths.dist + "/css"));
});
