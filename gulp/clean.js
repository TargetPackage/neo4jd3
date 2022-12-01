"use strict";

import { paths } from "./conf.js";
import del from "del";
import gulp from "gulp";

gulp.task("clean", function () {
	return del([
		paths.dist + "/**/*",
		paths.docs + "/css/neo4jd3.css",
		paths.docs + "/css/neo4jd3.min.css",
		paths.docs + "/js/neo4jd3.js",
		paths.docs + "/js/neo4jd3.min.js"
	]);
});
