"use strict";

import _ from "lodash";
import browserify from "browserify";
import buffer from "vinyl-buffer";
import c from "ansi-colors";
import concat from "gulp-concat";
import { paths } from "./conf.js";
import connect from "gulp-connect";
import derequire from "gulp-derequire";
import gulp from "gulp";
import gulpif from "gulp-if";
import jshint from "gulp-jshint";
import log from "fancy-log";
import notifier from "node-notifier";
import path from "path";
import plumber from "gulp-plumber";
import rename from "gulp-rename";
import source from "vinyl-source-stream";
import uglify from "gulp-uglify";
import watchify from "watchify";

gulp.task("scripts:external", function () {
	return gulp
		.src(["node_modules/d3/dist/d3.min.js"])
		.pipe(gulp.dest(paths.docs + "/js"))
		.pipe(connect.reload());
});

gulp.task("scripts:jshint", function () {
	return gulp
		.src("src/main/scripts/neo4jd3.js")
		.pipe(jshint(".jshintrc"))
		.pipe(jshint.reporter("default"));
});

const entryFile = path.join(paths.src, "/index.js");

gulp.task("scripts:derequire", function () {
	return buildScript(entryFile, "dev");
});

gulp.task("scripts:internal", gulp.series("scripts:jshint", "scripts:derequire"), function () {
	return gulp
		.src(paths.docs + "/js/neo4jd3.js")
		.pipe(concat("neo4jd3.js"))
		.pipe(gulp.dest(paths.docs + "/js"))
		.pipe(rename({ suffix: ".min" }))
		.pipe(uglify())
		.pipe(gulp.dest(paths.docs + "/js"))
		.pipe(connect.reload());
});

gulp.task("scripts", gulp.series("scripts:external", "scripts:internal"), function () {
	return gulp
		.src([paths.docs + "/js/neo4jd3.js", paths.docs + "/js/neo4jd3.min.js"])
		.pipe(gulp.dest(paths.dist + "/js"));
});

function buildScript(filename, mode) {
	const bundleFilename = "index.js";
	const browserifyConfig = {
		standalone: "Neo4jd3"
	};

	let bundler;
	if (mode === "dev") {
		bundler = browserify(filename, _.extend(browserifyConfig, { debug: true }));
	} else if (mode === "prod") {
		bundler = browserify(filename, browserifyConfig);
	} else if (mode === "watch") {
		if (cached[filename]) {
			return cached[filename].bundle();
		}

		bundler = watchify(
			browserify(filename, _.extend(browserifyConfig, watchify.args, { debug: true }))
		);
		cached[filename] = bundler;
	}

	function rebundle() {
		const stream = bundler.bundle().on("error", function (err) {
			error.call(this, err);
		});

		return stream
			.pipe(plumber({ errorHandler: error }))
			.pipe(source(bundleFilename))
			.pipe(derequire())
			.pipe(buffer())
			.pipe(gulpif(mode === "prod", uglify({ mangle: true })))
			.pipe(concat("neo4jd3.js"))
			.pipe(gulp.dest(paths.docs + "/js"));
	}

	// listen for an update and run rebundle
	bundler.on("update", function () {
		rebundle();
		log("Rebundle...");
	});

	// run it once the first time buildScript is called
	return rebundle();
}

function error(err) {
	notifier.notify({ message: "Error: " + err.message });
	log(c.red("Error: " + err));
	this.emit("end");
}
