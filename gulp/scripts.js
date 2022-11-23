"use strict";

const _ = require("lodash");
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const c = require("ansi-colors");
const concat = require("gulp-concat");
const conf = require("./conf");
const connect = require("gulp-connect");
const derequire = require("gulp-derequire");
const gulp = require("gulp");
const gulpif = require("gulp-if");
const jshint = require("gulp-jshint");
const log = require("fancy-log");
const notifier = require("node-notifier");
const path = require("path");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const source = require("vinyl-source-stream");
const uglify = require("gulp-uglify");
const watchify = require("watchify");

gulp.task("scripts:external", function () {
	return gulp
		.src(["node_modules/d3/dist/d3.min.js"])
		.pipe(gulp.dest(conf.paths.docs + "/js"))
		.pipe(connect.reload());
});

gulp.task("scripts:jshint", function () {
	return gulp
		.src("src/main/scripts/neo4jd3.js")
		.pipe(jshint(".jshintrc"))
		.pipe(jshint.reporter("default"));
});

const entryFile = path.join(conf.paths.src, "/index.js");

gulp.task("scripts:derequire", function () {
	return buildScript(entryFile, "dev");
});

gulp.task("scripts:internal", gulp.series("scripts:jshint", "scripts:derequire"), function () {
	return gulp
		.src(conf.paths.docs + "/js/neo4jd3.js")
		.pipe(concat("neo4jd3.js"))
		.pipe(gulp.dest(conf.paths.docs + "/js"))
		.pipe(rename({ suffix: ".min" }))
		.pipe(uglify())
		.pipe(gulp.dest(conf.paths.docs + "/js"))
		.pipe(connect.reload());
});

gulp.task("scripts", gulp.series("scripts:external", "scripts:internal"), function () {
	return gulp
		.src([conf.paths.docs + "/js/neo4jd3.js", conf.paths.docs + "/js/neo4jd3.min.js"])
		.pipe(gulp.dest(conf.paths.dist + "/js"));
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
			.pipe(gulp.dest(conf.paths.docs + "/js"));
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
