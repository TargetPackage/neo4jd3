"use strict";

const gulp = require("gulp"),
	Server = require("karma").Server;

process.env.NODE_PATH = process.cwd();

gulp.task("test:client", function (done) {
	var configFile = require("path").resolve("karma.conf.js");

	new Server(
		{
			configFile: configFile,
			singleRun: true
		},
		done
	).start();
});

gulp.task("watch:test", function () {
	gulp.watch(["src/main/scripts/**/*.js", "src/test/scripts/**/*.js"], ["test:client"]);
});

gulp.task("test", gulp.series("test:client"));
