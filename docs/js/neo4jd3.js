(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Neo4jd3 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
"use strict";

var neo4jd3 = _dereq_("./scripts/neo4jd3");

module.exports = neo4jd3;

},{"./scripts/neo4jd3":2}],2:[function(_dereq_,module,exports){
/* global d3, document */
/* jshint latedef:nofunc */
"use strict";

function Neo4jD3(_selector, _options) {
	var container,
		graph,
		info,
		node,
		nodes,
		relationship,
		relationshipOutline,
		relationshipOverlay,
		relationshipText,
		relationships,
		selector,
		simulation,
		svg,
		svgNodes,
		svgRelationships,
		svgScale,
		svgTranslate,
		classes2colors = {},
		justLoaded = false,
		numClasses = 0,
		options = {
			arrowSize: 4,
			colors: colors(),
			highlight: undefined,
			iconMap: fontAwesomeIcons(),
			icons: undefined,
			imageMap: {},
			images: undefined,
			infoPanel: true,
			minCollision: undefined,
			neo4jData: undefined,
			neo4jDataUrl: undefined,
			nodeOutlineFillColor: undefined,
			nodeRadius: 25,
			nodeTextProperty: undefined,
			nodeTextColor: "#ffffff",
			relationshipColor: "#a5abb6",
			zoomFit: false
		},
		VERSION = "0.0.1";

	function appendGraph(container) {
		svg = container
			.append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("class", "neo4jd3-graph")
			.call(
				d3.zoom().on("zoom", function (event) {
					var scale = event.transform.k,
						translate = [event.transform.x, event.transform.y];

					if (svgTranslate) {
						translate[0] += svgTranslate[0];
						translate[1] += svgTranslate[1];
					}

					if (svgScale) {
						scale *= svgScale;
					}

					svg.attr(
						"transform",
						"translate(" + translate[0] + ", " + translate[1] + ") scale(" + scale + ")"
					);
				})
			)
			.on("dblclick.zoom", null)
			.append("g")
			.attr("width", "100%")
			.attr("height", "100%");

		svgRelationships = svg.append("g").attr("class", "relationships");

		svgNodes = svg.append("g").attr("class", "nodes");
	}

	function appendImageToNode(node) {
		return node
			.append("image")
			.attr("height", function (d) {
				return icon(d) ? "24px" : "30px";
			})
			.attr("x", function (d) {
				return icon(d) ? "5px" : "-15px";
			})
			.attr("xlink:href", function (d) {
				return image(d);
			})
			.attr("y", function (d) {
				return icon(d) ? "5px" : "-16px";
			})
			.attr("width", function (d) {
				return icon(d) ? "24px" : "30px";
			});
	}

	function appendInfoPanel(container) {
		return container.append("div").attr("class", "neo4jd3-info");
	}

	function appendInfoElement(cls, isNode, property, value) {
		var elem = info.append("a");

		elem
			.attr("href", "#")
			.attr("class", cls)
			.html("<strong>" + property + "</strong>" + (value ? ": " + value : ""));

		if (!value) {
			elem
				.style("background-color", function (d) {
					return options.nodeOutlineFillColor
						? options.nodeOutlineFillColor
						: isNode
						? class2color(property)
						: defaultColor();
				})
				.style("border-color", function (d) {
					return options.nodeOutlineFillColor
						? class2darkenColor(options.nodeOutlineFillColor)
						: isNode
						? class2darkenColor(property)
						: defaultDarkenColor();
				})
				.style("color", function (d) {
					return options.nodeOutlineFillColor
						? class2darkenColor(options.nodeOutlineFillColor)
						: "#fff";
				});
		}
	}

	function appendInfoElementClass(cls, node) {
		appendInfoElement(cls, true, node);
	}

	function appendInfoElementProperty(cls, property, value) {
		appendInfoElement(cls, false, property, value);
	}

	function appendInfoElementRelationship(cls, relationship) {
		appendInfoElement(cls, false, relationship);
	}

	function appendNode() {
		return node
			.enter()
			.append("g")
			.attr("class", function (d) {
				var highlight,
					i,
					classes = "node",
					label = d.labels[0];

				if (icon(d)) {
					classes += " node-icon";
				}

				if (image(d)) {
					classes += " node-image";
				}

				if (options.highlight) {
					for (i = 0; i < options.highlight.length; i++) {
						highlight = options.highlight[i];

						if (
							d.labels[0] === highlight.class &&
							d.properties[highlight.property] === highlight.value
						) {
							classes += " node-highlighted";
							break;
						}
					}
				}

				return classes;
			})
			.on("click", function (d) {
				d.fx = d.fy = null;

				if (typeof options.onNodeClick === "function") {
					options.onNodeClick(d);
				}
			})
			.on("dblclick", function (d) {
				stickNode(d);

				if (typeof options.onNodeDoubleClick === "function") {
					options.onNodeDoubleClick(d);
				}
			})
			.on("mouseenter", function (d) {
				if (info) {
					updateInfo(d);
				}

				if (typeof options.onNodeMouseEnter === "function") {
					options.onNodeMouseEnter(d);
				}
			})
			.on("mouseleave", function (d) {
				if (info) {
					clearInfo(d);
				}

				if (typeof options.onNodeMouseLeave === "function") {
					options.onNodeMouseLeave(d);
				}
			})
			.call(d3.drag().on("start", dragStarted).on("drag", dragged).on("end", dragEnded));
	}

	function appendNodeToGraph() {
		var n = appendNode();

		appendRingToNode(n);
		appendOutlineToNode(n);

		if (options.icons) {
			appendTextToNode(n);
		}

		if (options.images) {
			appendImageToNode(n);
		}

		return n;
	}

	function appendOutlineToNode(node) {
		return node
			.append("circle")
			.attr("class", "outline")
			.attr("r", options.nodeRadius)
			.style("fill", function (d) {
				return options.nodeOutlineFillColor
					? options.nodeOutlineFillColor
					: class2color(d.labels[0]);
			})
			.style("stroke", function (d) {
				return options.nodeOutlineFillColor
					? class2darkenColor(options.nodeOutlineFillColor)
					: class2darkenColor(d.labels[0]);
			})
			.append("title")
			.text(function (d) {
				return toString(d);
			});
	}

	function appendRingToNode(node) {
		return node
			.append("circle")
			.attr("class", "ring")
			.attr("r", options.nodeRadius * 1.16)
			.append("title")
			.text(function (d) {
				return toString(d);
			});
	}

	function appendTextToNode(node) {
		return node
			.append("text")
			.attr("class", function (d) {
				return "text" + (icon(d) ? " icon" : "");
			})
			.attr("fill", options.nodeTextColor)
			.attr("font-size", function (d) {
				return icon(d) ? options.nodeRadius + "px" : "10px";
			})
			.attr("pointer-events", "none")
			.attr("text-anchor", "middle")
			.attr("y", function (d) {
				return icon(d) ? parseInt(Math.round(options.nodeRadius * 0.32)) + "px" : "4px";
			})
			.html(function (d) {
				const _icon = icon(d);
				let text = d.id;
				if (options.nodeTextProperty) {
					text = d.properties[options.nodeTextProperty];
				}

				return _icon ? "&#x" + _icon : text;
			});
	}

	function appendRandomDataToNode(d, maxNodesToGenerate) {
		var data = randomD3Data(d, maxNodesToGenerate);
		updateWithNeo4jData(data);
	}

	function appendRelationship() {
		return relationship
			.enter()
			.append("g")
			.attr("class", "relationship")
			.on("dblclick", function (d) {
				if (typeof options.onRelationshipDoubleClick === "function") {
					options.onRelationshipDoubleClick(d);
				}
			})
			.on("mouseenter", function (d) {
				if (info) {
					updateInfo(d);
				}
			});
	}

	function appendOutlineToRelationship(r) {
		return r.append("path").attr("class", "outline").attr("fill", "#a5abb6").attr("stroke", "none");
	}

	function appendOverlayToRelationship(r) {
		return r.append("path").attr("class", "overlay");
	}

	function appendTextToRelationship(r) {
		return r
			.append("text")
			.attr("class", "text")
			.attr("fill", "#000000")
			.attr("font-size", "8px")
			.attr("pointer-events", "none")
			.attr("text-anchor", "middle")
			.text(function (d) {
				return d.type;
			});
	}

	function appendRelationshipToGraph() {
		var relationship = appendRelationship(),
			text = appendTextToRelationship(relationship),
			outline = appendOutlineToRelationship(relationship),
			overlay = appendOverlayToRelationship(relationship);

		return {
			outline: outline,
			overlay: overlay,
			relationship: relationship,
			text: text
		};
	}

	function class2color(cls) {
		var color = classes2colors[cls];

		if (!color) {
			//            color = options.colors[Math.min(numClasses, options.colors.length - 1)];
			color = options.colors[numClasses % options.colors.length];
			classes2colors[cls] = color;
			numClasses++;
		}

		return color;
	}

	function class2darkenColor(cls) {
		return d3.rgb(class2color(cls)).darker(1);
	}

	function clearInfo() {
		info.html("");
	}

	function color() {
		return options.colors[(options.colors.length * Math.random()) << 0];
	}

	function colors() {
		// d3.schemeCategory10,
		// d3.schemeCategory20,
		return [
			"#68bdf6", // light blue
			"#6dce9e", // green #1
			"#faafc2", // light pink
			"#f2baf6", // purple
			"#ff928c", // light red
			"#fcea7e", // light yellow
			"#ffc766", // light orange
			"#405f9e", // navy blue
			"#a5abb6", // dark gray
			"#78cecb", // green #2,
			"#b88cbb", // dark purple
			"#ced2d9", // light gray
			"#e84646", // dark red
			"#fa5f86", // dark pink
			"#ffab1a", // dark orange
			"#fcda19", // dark yellow
			"#797b80", // black
			"#c9d96f", // pistacchio
			"#47991f", // green #3
			"#70edee", // turquoise
			"#ff75ea" // pink
		];
	}

	function contains(array, id) {
		var filter = array.filter(function (elem) {
			return elem.id === id;
		});

		return filter.length > 0;
	}

	function defaultColor() {
		return options.relationshipColor;
	}

	function defaultDarkenColor() {
		return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
	}

	function dragEnded(d) {
		if (!d3.event.active) {
			simulation.alphaTarget(0);
		}

		if (typeof options.onNodeDragEnd === "function") {
			options.onNodeDragEnd(d);
		}
	}

	function dragged(d) {
		stickNode(d);
	}

	function dragStarted(d) {
		if (!d3.event.active) {
			simulation.alphaTarget(0.3).restart();
		}

		d.fx = d.x;
		d.fy = d.y;

		if (typeof options.onNodeDragStart === "function") {
			options.onNodeDragStart(d);
		}
	}

	function extend(obj1, obj2) {
		var obj = {};

		merge(obj, obj1);
		merge(obj, obj2);

		return obj;
	}

	function fontAwesomeIcons() {
		return {
			glass: "f000",
			music: "f001",
			search: "f002",
			"envelope-o": "f003",
			heart: "f004",
			star: "f005",
			"star-o": "f006",
			user: "f007",
			film: "f008",
			"th-large": "f009",
			th: "f00a",
			"th-list": "f00b",
			check: "f00c",
			"remove,close,times": "f00d",
			"search-plus": "f00e",
			"search-minus": "f010",
			"power-off": "f011",
			signal: "f012",
			"gear,cog": "f013",
			"trash-o": "f014",
			home: "f015",
			"file-o": "f016",
			"clock-o": "f017",
			road: "f018",
			download: "f019",
			"arrow-circle-o-down": "f01a",
			"arrow-circle-o-up": "f01b",
			inbox: "f01c",
			"play-circle-o": "f01d",
			"rotate-right,repeat": "f01e",
			refresh: "f021",
			"list-alt": "f022",
			lock: "f023",
			flag: "f024",
			headphones: "f025",
			"volume-off": "f026",
			"volume-down": "f027",
			"volume-up": "f028",
			qrcode: "f029",
			barcode: "f02a",
			tag: "f02b",
			tags: "f02c",
			book: "f02d",
			bookmark: "f02e",
			print: "f02f",
			camera: "f030",
			font: "f031",
			bold: "f032",
			italic: "f033",
			"text-height": "f034",
			"text-width": "f035",
			"align-left": "f036",
			"align-center": "f037",
			"align-right": "f038",
			"align-justify": "f039",
			list: "f03a",
			"dedent,outdent": "f03b",
			indent: "f03c",
			"video-camera": "f03d",
			"photo,image,picture-o": "f03e",
			pencil: "f040",
			"map-marker": "f041",
			adjust: "f042",
			tint: "f043",
			"edit,pencil-square-o": "f044",
			"share-square-o": "f045",
			"check-square-o": "f046",
			arrows: "f047",
			"step-backward": "f048",
			"fast-backward": "f049",
			backward: "f04a",
			play: "f04b",
			pause: "f04c",
			stop: "f04d",
			forward: "f04e",
			"fast-forward": "f050",
			"step-forward": "f051",
			eject: "f052",
			"chevron-left": "f053",
			"chevron-right": "f054",
			"plus-circle": "f055",
			"minus-circle": "f056",
			"times-circle": "f057",
			"check-circle": "f058",
			"question-circle": "f059",
			"info-circle": "f05a",
			crosshairs: "f05b",
			"times-circle-o": "f05c",
			"check-circle-o": "f05d",
			ban: "f05e",
			"arrow-left": "f060",
			"arrow-right": "f061",
			"arrow-up": "f062",
			"arrow-down": "f063",
			"mail-forward,share": "f064",
			expand: "f065",
			compress: "f066",
			plus: "f067",
			minus: "f068",
			asterisk: "f069",
			"exclamation-circle": "f06a",
			gift: "f06b",
			leaf: "f06c",
			fire: "f06d",
			eye: "f06e",
			"eye-slash": "f070",
			"warning,exclamation-triangle": "f071",
			plane: "f072",
			calendar: "f073",
			random: "f074",
			comment: "f075",
			magnet: "f076",
			"chevron-up": "f077",
			"chevron-down": "f078",
			retweet: "f079",
			"shopping-cart": "f07a",
			folder: "f07b",
			"folder-open": "f07c",
			"arrows-v": "f07d",
			"arrows-h": "f07e",
			"bar-chart-o,bar-chart": "f080",
			"twitter-square": "f081",
			"facebook-square": "f082",
			"camera-retro": "f083",
			key: "f084",
			"gears,cogs": "f085",
			comments: "f086",
			"thumbs-o-up": "f087",
			"thumbs-o-down": "f088",
			"star-half": "f089",
			"heart-o": "f08a",
			"sign-out": "f08b",
			"linkedin-square": "f08c",
			"thumb-tack": "f08d",
			"external-link": "f08e",
			"sign-in": "f090",
			trophy: "f091",
			"github-square": "f092",
			upload: "f093",
			"lemon-o": "f094",
			phone: "f095",
			"square-o": "f096",
			"bookmark-o": "f097",
			"phone-square": "f098",
			twitter: "f099",
			"facebook-f,facebook": "f09a",
			github: "f09b",
			unlock: "f09c",
			"credit-card": "f09d",
			"feed,rss": "f09e",
			"hdd-o": "f0a0",
			bullhorn: "f0a1",
			bell: "f0f3",
			certificate: "f0a3",
			"hand-o-right": "f0a4",
			"hand-o-left": "f0a5",
			"hand-o-up": "f0a6",
			"hand-o-down": "f0a7",
			"arrow-circle-left": "f0a8",
			"arrow-circle-right": "f0a9",
			"arrow-circle-up": "f0aa",
			"arrow-circle-down": "f0ab",
			globe: "f0ac",
			wrench: "f0ad",
			tasks: "f0ae",
			filter: "f0b0",
			briefcase: "f0b1",
			"arrows-alt": "f0b2",
			"group,users": "f0c0",
			"chain,link": "f0c1",
			cloud: "f0c2",
			flask: "f0c3",
			"cut,scissors": "f0c4",
			"copy,files-o": "f0c5",
			paperclip: "f0c6",
			"save,floppy-o": "f0c7",
			square: "f0c8",
			"navicon,reorder,bars": "f0c9",
			"list-ul": "f0ca",
			"list-ol": "f0cb",
			strikethrough: "f0cc",
			underline: "f0cd",
			table: "f0ce",
			magic: "f0d0",
			truck: "f0d1",
			pinterest: "f0d2",
			"pinterest-square": "f0d3",
			"google-plus-square": "f0d4",
			"google-plus": "f0d5",
			money: "f0d6",
			"caret-down": "f0d7",
			"caret-up": "f0d8",
			"caret-left": "f0d9",
			"caret-right": "f0da",
			columns: "f0db",
			"unsorted,sort": "f0dc",
			"sort-down,sort-desc": "f0dd",
			"sort-up,sort-asc": "f0de",
			envelope: "f0e0",
			linkedin: "f0e1",
			"rotate-left,undo": "f0e2",
			"legal,gavel": "f0e3",
			"dashboard,tachometer": "f0e4",
			"comment-o": "f0e5",
			"comments-o": "f0e6",
			"flash,bolt": "f0e7",
			sitemap: "f0e8",
			umbrella: "f0e9",
			"paste,clipboard": "f0ea",
			"lightbulb-o": "f0eb",
			exchange: "f0ec",
			"cloud-download": "f0ed",
			"cloud-upload": "f0ee",
			"user-md": "f0f0",
			stethoscope: "f0f1",
			suitcase: "f0f2",
			"bell-o": "f0a2",
			coffee: "f0f4",
			cutlery: "f0f5",
			"file-text-o": "f0f6",
			"building-o": "f0f7",
			"hospital-o": "f0f8",
			ambulance: "f0f9",
			medkit: "f0fa",
			"fighter-jet": "f0fb",
			beer: "f0fc",
			"h-square": "f0fd",
			"plus-square": "f0fe",
			"angle-double-left": "f100",
			"angle-double-right": "f101",
			"angle-double-up": "f102",
			"angle-double-down": "f103",
			"angle-left": "f104",
			"angle-right": "f105",
			"angle-up": "f106",
			"angle-down": "f107",
			desktop: "f108",
			laptop: "f109",
			tablet: "f10a",
			"mobile-phone,mobile": "f10b",
			"circle-o": "f10c",
			"quote-left": "f10d",
			"quote-right": "f10e",
			spinner: "f110",
			circle: "f111",
			"mail-reply,reply": "f112",
			"github-alt": "f113",
			"folder-o": "f114",
			"folder-open-o": "f115",
			"smile-o": "f118",
			"frown-o": "f119",
			"meh-o": "f11a",
			gamepad: "f11b",
			"keyboard-o": "f11c",
			"flag-o": "f11d",
			"flag-checkered": "f11e",
			terminal: "f120",
			code: "f121",
			"mail-reply-all,reply-all": "f122",
			"star-half-empty,star-half-full,star-half-o": "f123",
			"location-arrow": "f124",
			crop: "f125",
			"code-fork": "f126",
			"unlink,chain-broken": "f127",
			question: "f128",
			info: "f129",
			exclamation: "f12a",
			superscript: "f12b",
			subscript: "f12c",
			eraser: "f12d",
			"puzzle-piece": "f12e",
			microphone: "f130",
			"microphone-slash": "f131",
			shield: "f132",
			"calendar-o": "f133",
			"fire-extinguisher": "f134",
			rocket: "f135",
			maxcdn: "f136",
			"chevron-circle-left": "f137",
			"chevron-circle-right": "f138",
			"chevron-circle-up": "f139",
			"chevron-circle-down": "f13a",
			html5: "f13b",
			css3: "f13c",
			anchor: "f13d",
			"unlock-alt": "f13e",
			bullseye: "f140",
			"ellipsis-h": "f141",
			"ellipsis-v": "f142",
			"rss-square": "f143",
			"play-circle": "f144",
			ticket: "f145",
			"minus-square": "f146",
			"minus-square-o": "f147",
			"level-up": "f148",
			"level-down": "f149",
			"check-square": "f14a",
			"pencil-square": "f14b",
			"external-link-square": "f14c",
			"share-square": "f14d",
			compass: "f14e",
			"toggle-down,caret-square-o-down": "f150",
			"toggle-up,caret-square-o-up": "f151",
			"toggle-right,caret-square-o-right": "f152",
			"euro,eur": "f153",
			gbp: "f154",
			"dollar,usd": "f155",
			"rupee,inr": "f156",
			"cny,rmb,yen,jpy": "f157",
			"ruble,rouble,rub": "f158",
			"won,krw": "f159",
			"bitcoin,btc": "f15a",
			file: "f15b",
			"file-text": "f15c",
			"sort-alpha-asc": "f15d",
			"sort-alpha-desc": "f15e",
			"sort-amount-asc": "f160",
			"sort-amount-desc": "f161",
			"sort-numeric-asc": "f162",
			"sort-numeric-desc": "f163",
			"thumbs-up": "f164",
			"thumbs-down": "f165",
			"youtube-square": "f166",
			youtube: "f167",
			xing: "f168",
			"xing-square": "f169",
			"youtube-play": "f16a",
			dropbox: "f16b",
			"stack-overflow": "f16c",
			instagram: "f16d",
			flickr: "f16e",
			adn: "f170",
			bitbucket: "f171",
			"bitbucket-square": "f172",
			tumblr: "f173",
			"tumblr-square": "f174",
			"long-arrow-down": "f175",
			"long-arrow-up": "f176",
			"long-arrow-left": "f177",
			"long-arrow-right": "f178",
			apple: "f179",
			windows: "f17a",
			android: "f17b",
			linux: "f17c",
			dribbble: "f17d",
			skype: "f17e",
			foursquare: "f180",
			trello: "f181",
			female: "f182",
			male: "f183",
			"gittip,gratipay": "f184",
			"sun-o": "f185",
			"moon-o": "f186",
			archive: "f187",
			bug: "f188",
			vk: "f189",
			weibo: "f18a",
			renren: "f18b",
			pagelines: "f18c",
			"stack-exchange": "f18d",
			"arrow-circle-o-right": "f18e",
			"arrow-circle-o-left": "f190",
			"toggle-left,caret-square-o-left": "f191",
			"dot-circle-o": "f192",
			wheelchair: "f193",
			"vimeo-square": "f194",
			"turkish-lira,try": "f195",
			"plus-square-o": "f196",
			"space-shuttle": "f197",
			slack: "f198",
			"envelope-square": "f199",
			wordpress: "f19a",
			openid: "f19b",
			"institution,bank,university": "f19c",
			"mortar-board,graduation-cap": "f19d",
			yahoo: "f19e",
			google: "f1a0",
			reddit: "f1a1",
			"reddit-square": "f1a2",
			"stumbleupon-circle": "f1a3",
			stumbleupon: "f1a4",
			delicious: "f1a5",
			digg: "f1a6",
			"pied-piper-pp": "f1a7",
			"pied-piper-alt": "f1a8",
			drupal: "f1a9",
			joomla: "f1aa",
			language: "f1ab",
			fax: "f1ac",
			building: "f1ad",
			child: "f1ae",
			paw: "f1b0",
			spoon: "f1b1",
			cube: "f1b2",
			cubes: "f1b3",
			behance: "f1b4",
			"behance-square": "f1b5",
			steam: "f1b6",
			"steam-square": "f1b7",
			recycle: "f1b8",
			"automobile,car": "f1b9",
			"cab,taxi": "f1ba",
			tree: "f1bb",
			spotify: "f1bc",
			deviantart: "f1bd",
			soundcloud: "f1be",
			database: "f1c0",
			"file-pdf-o": "f1c1",
			"file-word-o": "f1c2",
			"file-excel-o": "f1c3",
			"file-powerpoint-o": "f1c4",
			"file-photo-o,file-picture-o,file-image-o": "f1c5",
			"file-zip-o,file-archive-o": "f1c6",
			"file-sound-o,file-audio-o": "f1c7",
			"file-movie-o,file-video-o": "f1c8",
			"file-code-o": "f1c9",
			vine: "f1ca",
			codepen: "f1cb",
			jsfiddle: "f1cc",
			"life-bouy,life-buoy,life-saver,support,life-ring": "f1cd",
			"circle-o-notch": "f1ce",
			"ra,resistance,rebel": "f1d0",
			"ge,empire": "f1d1",
			"git-square": "f1d2",
			git: "f1d3",
			"y-combinator-square,yc-square,hacker-news": "f1d4",
			"tencent-weibo": "f1d5",
			qq: "f1d6",
			"wechat,weixin": "f1d7",
			"send,paper-plane": "f1d8",
			"send-o,paper-plane-o": "f1d9",
			history: "f1da",
			"circle-thin": "f1db",
			header: "f1dc",
			paragraph: "f1dd",
			sliders: "f1de",
			"share-alt": "f1e0",
			"share-alt-square": "f1e1",
			bomb: "f1e2",
			"soccer-ball-o,futbol-o": "f1e3",
			tty: "f1e4",
			binoculars: "f1e5",
			plug: "f1e6",
			slideshare: "f1e7",
			twitch: "f1e8",
			yelp: "f1e9",
			"newspaper-o": "f1ea",
			wifi: "f1eb",
			calculator: "f1ec",
			paypal: "f1ed",
			"google-wallet": "f1ee",
			"cc-visa": "f1f0",
			"cc-mastercard": "f1f1",
			"cc-discover": "f1f2",
			"cc-amex": "f1f3",
			"cc-paypal": "f1f4",
			"cc-stripe": "f1f5",
			"bell-slash": "f1f6",
			"bell-slash-o": "f1f7",
			trash: "f1f8",
			copyright: "f1f9",
			at: "f1fa",
			eyedropper: "f1fb",
			"paint-brush": "f1fc",
			"birthday-cake": "f1fd",
			"area-chart": "f1fe",
			"pie-chart": "f200",
			"line-chart": "f201",
			lastfm: "f202",
			"lastfm-square": "f203",
			"toggle-off": "f204",
			"toggle-on": "f205",
			bicycle: "f206",
			bus: "f207",
			ioxhost: "f208",
			angellist: "f209",
			cc: "f20a",
			"shekel,sheqel,ils": "f20b",
			meanpath: "f20c",
			buysellads: "f20d",
			connectdevelop: "f20e",
			dashcube: "f210",
			forumbee: "f211",
			leanpub: "f212",
			sellsy: "f213",
			shirtsinbulk: "f214",
			simplybuilt: "f215",
			skyatlas: "f216",
			"cart-plus": "f217",
			"cart-arrow-down": "f218",
			diamond: "f219",
			ship: "f21a",
			"user-secret": "f21b",
			motorcycle: "f21c",
			"street-view": "f21d",
			heartbeat: "f21e",
			venus: "f221",
			mars: "f222",
			mercury: "f223",
			"intersex,transgender": "f224",
			"transgender-alt": "f225",
			"venus-double": "f226",
			"mars-double": "f227",
			"venus-mars": "f228",
			"mars-stroke": "f229",
			"mars-stroke-v": "f22a",
			"mars-stroke-h": "f22b",
			neuter: "f22c",
			genderless: "f22d",
			"facebook-official": "f230",
			"pinterest-p": "f231",
			whatsapp: "f232",
			server: "f233",
			"user-plus": "f234",
			"user-times": "f235",
			"hotel,bed": "f236",
			viacoin: "f237",
			train: "f238",
			subway: "f239",
			medium: "f23a",
			"yc,y-combinator": "f23b",
			"optin-monster": "f23c",
			opencart: "f23d",
			expeditedssl: "f23e",
			"battery-4,battery-full": "f240",
			"battery-3,battery-three-quarters": "f241",
			"battery-2,battery-half": "f242",
			"battery-1,battery-quarter": "f243",
			"battery-0,battery-empty": "f244",
			"mouse-pointer": "f245",
			"i-cursor": "f246",
			"object-group": "f247",
			"object-ungroup": "f248",
			"sticky-note": "f249",
			"sticky-note-o": "f24a",
			"cc-jcb": "f24b",
			"cc-diners-club": "f24c",
			clone: "f24d",
			"balance-scale": "f24e",
			"hourglass-o": "f250",
			"hourglass-1,hourglass-start": "f251",
			"hourglass-2,hourglass-half": "f252",
			"hourglass-3,hourglass-end": "f253",
			hourglass: "f254",
			"hand-grab-o,hand-rock-o": "f255",
			"hand-stop-o,hand-paper-o": "f256",
			"hand-scissors-o": "f257",
			"hand-lizard-o": "f258",
			"hand-spock-o": "f259",
			"hand-pointer-o": "f25a",
			"hand-peace-o": "f25b",
			trademark: "f25c",
			registered: "f25d",
			"creative-commons": "f25e",
			gg: "f260",
			"gg-circle": "f261",
			tripadvisor: "f262",
			odnoklassniki: "f263",
			"odnoklassniki-square": "f264",
			"get-pocket": "f265",
			"wikipedia-w": "f266",
			safari: "f267",
			chrome: "f268",
			firefox: "f269",
			opera: "f26a",
			"internet-explorer": "f26b",
			"tv,television": "f26c",
			contao: "f26d",
			"500px": "f26e",
			amazon: "f270",
			"calendar-plus-o": "f271",
			"calendar-minus-o": "f272",
			"calendar-times-o": "f273",
			"calendar-check-o": "f274",
			industry: "f275",
			"map-pin": "f276",
			"map-signs": "f277",
			"map-o": "f278",
			map: "f279",
			commenting: "f27a",
			"commenting-o": "f27b",
			houzz: "f27c",
			vimeo: "f27d",
			"black-tie": "f27e",
			fonticons: "f280",
			"reddit-alien": "f281",
			edge: "f282",
			"credit-card-alt": "f283",
			codiepie: "f284",
			modx: "f285",
			"fort-awesome": "f286",
			usb: "f287",
			"product-hunt": "f288",
			mixcloud: "f289",
			scribd: "f28a",
			"pause-circle": "f28b",
			"pause-circle-o": "f28c",
			"stop-circle": "f28d",
			"stop-circle-o": "f28e",
			"shopping-bag": "f290",
			"shopping-basket": "f291",
			hashtag: "f292",
			bluetooth: "f293",
			"bluetooth-b": "f294",
			percent: "f295",
			gitlab: "f296",
			wpbeginner: "f297",
			wpforms: "f298",
			envira: "f299",
			"universal-access": "f29a",
			"wheelchair-alt": "f29b",
			"question-circle-o": "f29c",
			blind: "f29d",
			"audio-description": "f29e",
			"volume-control-phone": "f2a0",
			braille: "f2a1",
			"assistive-listening-systems": "f2a2",
			"asl-interpreting,american-sign-language-interpreting": "f2a3",
			"deafness,hard-of-hearing,deaf": "f2a4",
			glide: "f2a5",
			"glide-g": "f2a6",
			"signing,sign-language": "f2a7",
			"low-vision": "f2a8",
			viadeo: "f2a9",
			"viadeo-square": "f2aa",
			snapchat: "f2ab",
			"snapchat-ghost": "f2ac",
			"snapchat-square": "f2ad",
			"pied-piper": "f2ae",
			"first-order": "f2b0",
			yoast: "f2b1",
			themeisle: "f2b2",
			"google-plus-circle,google-plus-official": "f2b3",
			"fa,font-awesome": "f2b4"
		};
	}

	function icon(d) {
		var code;

		if (options.iconMap && options.showIcons && options.icons) {
			if (options.icons[d.labels[0]] && options.iconMap[options.icons[d.labels[0]]]) {
				code = options.iconMap[options.icons[d.labels[0]]];
			} else if (options.iconMap[d.labels[0]]) {
				code = options.iconMap[d.labels[0]];
			} else if (options.icons[d.labels[0]]) {
				code = options.icons[d.labels[0]];
			}
		}

		return code;
	}

	function image(d) {
		var i, imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

		if (options.images) {
			imagesForLabel = options.imageMap[d.labels[0]];

			if (imagesForLabel) {
				imgLevel = 0;

				for (i = 0; i < imagesForLabel.length; i++) {
					labelPropertyValue = imagesForLabel[i].split("|");

					switch (labelPropertyValue.length) {
						case 3:
							value = labelPropertyValue[2];
						/* falls through */
						case 2:
							property = labelPropertyValue[1];
						/* falls through */
						case 1:
							label = labelPropertyValue[0];
					}

					if (
						d.labels[0] === label &&
						(!property || d.properties[property] !== undefined) &&
						(!value || d.properties[property] === value)
					) {
						if (labelPropertyValue.length > imgLevel) {
							img = options.images[imagesForLabel[i]];
							imgLevel = labelPropertyValue.length;
						}
					}
				}
			}
		}

		return img;
	}

	function init(_selector, _options) {
		initIconMap();

		merge(options, _options);

		if (options.icons) {
			options.showIcons = true;
		}

		if (!options.minCollision) {
			options.minCollision = options.nodeRadius * 2;
		}

		initImageMap();

		selector = _selector;

		container = d3.select(selector);

		container.attr("class", "neo4jd3").html("");

		if (options.infoPanel) {
			info = appendInfoPanel(container);
		}

		appendGraph(container);

		simulation = initSimulation();

		if (options.neo4jData) {
			loadNeo4jData(options.neo4jData);
		} else if (options.neo4jDataUrl) {
			loadNeo4jDataFromUrl(options.neo4jDataUrl);
		} else {
			console.error("Error: both neo4jData and neo4jDataUrl are empty!");
		}
	}

	function initIconMap() {
		Object.keys(options.iconMap).forEach(function (key, index) {
			var keys = key.split(","),
				value = options.iconMap[key];

			keys.forEach(function (key) {
				options.iconMap[key] = value;
			});
		});
	}

	function initImageMap() {
		var key, keys, selector;

		for (key in options.images) {
			if (options.images.hasOwnProperty(key)) {
				keys = key.split("|");

				if (!options.imageMap[keys[0]]) {
					options.imageMap[keys[0]] = [key];
				} else {
					options.imageMap[keys[0]].push(key);
				}
			}
		}
	}

	function initSimulation() {
		var simulation = d3
			.forceSimulation()
			//                           .velocityDecay(0.8)
			//                           .force('x', d3.force().strength(0.002))
			//                           .force('y', d3.force().strength(0.002))
			.force(
				"collide",
				d3
					.forceCollide()
					.radius(function (d) {
						return options.minCollision;
					})
					.iterations(2)
			)
			.force("charge", d3.forceManyBody())
			.force(
				"link",
				d3.forceLink().id(function (d) {
					return d.id;
				})
			)
			.force(
				"center",
				d3.forceCenter(
					svg.node().parentElement.parentElement.clientWidth / 2,
					svg.node().parentElement.parentElement.clientHeight / 2
				)
			)
			.on("tick", function () {
				tick();
			})
			.on("end", function () {
				if (options.zoomFit && !justLoaded) {
					justLoaded = true;
					zoomFit(2);
				}
			});

		return simulation;
	}

	function loadNeo4jData() {
		nodes = [];
		relationships = [];

		updateWithNeo4jData(options.neo4jData);
	}

	function loadNeo4jDataFromUrl(neo4jDataUrl) {
		nodes = [];
		relationships = [];

		d3.json(neo4jDataUrl, function (error, data) {
			if (error) {
				throw error;
			}

			updateWithNeo4jData(data);
		});
	}

	function merge(target, source) {
		Object.keys(source).forEach(function (property) {
			target[property] = source[property];
		});
	}

	function neo4jDataToD3Data(data) {
		var graph = {
			nodes: [],
			relationships: []
		};

		data.results.forEach(function (result) {
			result.data.forEach(function (data) {
				data.graph.nodes.forEach(function (node) {
					if (!contains(graph.nodes, node.id)) {
						graph.nodes.push(node);
					}
				});

				data.graph.relationships.forEach(function (relationship) {
					relationship.source = relationship.startNode;
					relationship.target = relationship.endNode;
					graph.relationships.push(relationship);
				});

				data.graph.relationships.sort(function (a, b) {
					if (a.source > b.source) {
						return 1;
					} else if (a.source < b.source) {
						return -1;
					} else {
						if (a.target > b.target) {
							return 1;
						}

						if (a.target < b.target) {
							return -1;
						} else {
							return 0;
						}
					}
				});

				for (var i = 0; i < data.graph.relationships.length; i++) {
					if (
						i !== 0 &&
						data.graph.relationships[i].source === data.graph.relationships[i - 1].source &&
						data.graph.relationships[i].target === data.graph.relationships[i - 1].target
					) {
						data.graph.relationships[i].linknum = data.graph.relationships[i - 1].linknum + 1;
					} else {
						data.graph.relationships[i].linknum = 1;
					}
				}
			});
		});

		return graph;
	}

	function randomD3Data(d, maxNodesToGenerate) {
		var data = {
				nodes: [],
				relationships: []
			},
			i,
			label,
			node,
			numNodes = ((maxNodesToGenerate * Math.random()) << 0) + 1,
			relationship,
			s = size();

		for (i = 0; i < numNodes; i++) {
			label = randomLabel();

			node = {
				id: s.nodes + 1 + i,
				labels: [label],
				properties: {
					random: label
				},
				x: d.x,
				y: d.y
			};

			data.nodes[data.nodes.length] = node;

			relationship = {
				id: s.relationships + 1 + i,
				type: label.toUpperCase(),
				startNode: d.id,
				endNode: s.nodes + 1 + i,
				properties: {
					from: Date.now()
				},
				source: d.id,
				target: s.nodes + 1 + i,
				linknum: s.relationships + 1 + i
			};

			data.relationships[data.relationships.length] = relationship;
		}

		return data;
	}

	function randomLabel() {
		var icons = Object.keys(options.iconMap);
		return icons[(icons.length * Math.random()) << 0];
	}

	function resetWithNeo4jData(neo4jData) {
		// Call the init method again with new data
		var newOptions = Object.assign(_options, {
			neo4jData: neo4jData,
			neo4jDataUrl: undefined
		});
		init(_selector, newOptions);
	}

	function rotate(cx, cy, x, y, angle) {
		var radians = (Math.PI / 180) * angle,
			cos = Math.cos(radians),
			sin = Math.sin(radians),
			nx = cos * (x - cx) + sin * (y - cy) + cx,
			ny = cos * (y - cy) - sin * (x - cx) + cy;

		return { x: nx, y: ny };
	}

	function rotatePoint(c, p, angle) {
		return rotate(c.x, c.y, p.x, p.y, angle);
	}

	function rotation(source, target) {
		return (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI;
	}

	function size() {
		return {
			nodes: nodes.length,
			relationships: relationships.length
		};
	}
	/*
    function smoothTransform(elem, translate, scale) {
        var animationMilliseconds = 5000,
            timeoutMilliseconds = 50,
            steps = parseInt(animationMilliseconds / timeoutMilliseconds);

        setTimeout(function() {
            smoothTransformStep(elem, translate, scale, timeoutMilliseconds, 1, steps);
        }, timeoutMilliseconds);
    }

    function smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step, steps) {
        var progress = step / steps;

        elem.attr('transform', 'translate(' + (translate[0] * progress) + ', ' + (translate[1] * progress) + ') scale(' + (scale * progress) + ')');

        if (step < steps) {
            setTimeout(function() {
                smoothTransformStep(elem, translate, scale, timeoutMilliseconds, step + 1, steps);
            }, timeoutMilliseconds);
        }
    }
*/
	function stickNode(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function tick() {
		tickNodes();
		tickRelationships();
	}

	function tickNodes() {
		if (node) {
			node.attr("transform", function (d) {
				return "translate(" + d.x + ", " + d.y + ")";
			});
		}
	}

	function tickRelationships() {
		if (relationship) {
			relationship.attr("transform", function (d) {
				var angle = rotation(d.source, d.target);
				return "translate(" + d.source.x + ", " + d.source.y + ") rotate(" + angle + ")";
			});

			tickRelationshipsTexts();
			tickRelationshipsOutlines();
			tickRelationshipsOverlays();
		}
	}

	function tickRelationshipsOutlines() {
		relationship.each(function (relationship) {
			var rel = d3.select(this),
				outline = rel.select(".outline"),
				text = rel.select(".text"),
				bbox = text.node().getBBox(),
				padding = 3;

			outline.attr("d", function (d) {
				var center = { x: 0, y: 0 },
					angle = rotation(d.source, d.target),
					textBoundingBox = text.node().getBBox(),
					textPadding = 5,
					u = unitaryVector(d.source, d.target),
					textMargin = {
						x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5,
						y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5
					},
					n = unitaryNormalVector(d.source, d.target),
					rotatedPointA1 = rotatePoint(
						center,
						{
							x: 0 + (options.nodeRadius + 1) * u.x - n.x,
							y: 0 + (options.nodeRadius + 1) * u.y - n.y
						},
						angle
					),
					rotatedPointB1 = rotatePoint(
						center,
						{ x: textMargin.x - n.x, y: textMargin.y - n.y },
						angle
					),
					rotatedPointC1 = rotatePoint(center, { x: textMargin.x, y: textMargin.y }, angle),
					rotatedPointD1 = rotatePoint(
						center,
						{
							x: 0 + (options.nodeRadius + 1) * u.x,
							y: 0 + (options.nodeRadius + 1) * u.y
						},
						angle
					),
					rotatedPointA2 = rotatePoint(
						center,
						{
							x: d.target.x - d.source.x - textMargin.x - n.x,
							y: d.target.y - d.source.y - textMargin.y - n.y
						},
						angle
					),
					rotatedPointB2 = rotatePoint(
						center,
						{
							x:
								d.target.x -
								d.source.x -
								(options.nodeRadius + 1) * u.x -
								n.x -
								u.x * options.arrowSize,
							y:
								d.target.y -
								d.source.y -
								(options.nodeRadius + 1) * u.y -
								n.y -
								u.y * options.arrowSize
						},
						angle
					),
					rotatedPointC2 = rotatePoint(
						center,
						{
							x:
								d.target.x -
								d.source.x -
								(options.nodeRadius + 1) * u.x -
								n.x +
								(n.x - u.x) * options.arrowSize,
							y:
								d.target.y -
								d.source.y -
								(options.nodeRadius + 1) * u.y -
								n.y +
								(n.y - u.y) * options.arrowSize
						},
						angle
					),
					rotatedPointD2 = rotatePoint(
						center,
						{
							x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x,
							y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y
						},
						angle
					),
					rotatedPointE2 = rotatePoint(
						center,
						{
							x:
								d.target.x -
								d.source.x -
								(options.nodeRadius + 1) * u.x +
								(-n.x - u.x) * options.arrowSize,
							y:
								d.target.y -
								d.source.y -
								(options.nodeRadius + 1) * u.y +
								(-n.y - u.y) * options.arrowSize
						},
						angle
					),
					rotatedPointF2 = rotatePoint(
						center,
						{
							x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize,
							y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize
						},
						angle
					),
					rotatedPointG2 = rotatePoint(
						center,
						{
							x: d.target.x - d.source.x - textMargin.x,
							y: d.target.y - d.source.y - textMargin.y
						},
						angle
					);

				return (
					"M " +
					rotatedPointA1.x +
					" " +
					rotatedPointA1.y +
					" L " +
					rotatedPointB1.x +
					" " +
					rotatedPointB1.y +
					" L " +
					rotatedPointC1.x +
					" " +
					rotatedPointC1.y +
					" L " +
					rotatedPointD1.x +
					" " +
					rotatedPointD1.y +
					" Z M " +
					rotatedPointA2.x +
					" " +
					rotatedPointA2.y +
					" L " +
					rotatedPointB2.x +
					" " +
					rotatedPointB2.y +
					" L " +
					rotatedPointC2.x +
					" " +
					rotatedPointC2.y +
					" L " +
					rotatedPointD2.x +
					" " +
					rotatedPointD2.y +
					" L " +
					rotatedPointE2.x +
					" " +
					rotatedPointE2.y +
					" L " +
					rotatedPointF2.x +
					" " +
					rotatedPointF2.y +
					" L " +
					rotatedPointG2.x +
					" " +
					rotatedPointG2.y +
					" Z"
				);
			});
		});
	}

	function tickRelationshipsOverlays() {
		relationshipOverlay.attr("d", function (d) {
			var center = { x: 0, y: 0 },
				angle = rotation(d.source, d.target),
				n1 = unitaryNormalVector(d.source, d.target),
				n = unitaryNormalVector(d.source, d.target, 50),
				rotatedPointA = rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle),
				rotatedPointB = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x - n.x,
						y: d.target.y - d.source.y - n.y
					},
					angle
				),
				rotatedPointC = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x + n.x - n1.x,
						y: d.target.y - d.source.y + n.y - n1.y
					},
					angle
				),
				rotatedPointD = rotatePoint(center, { x: 0 + n.x - n1.x, y: 0 + n.y - n1.y }, angle);

			return (
				"M " +
				rotatedPointA.x +
				" " +
				rotatedPointA.y +
				" L " +
				rotatedPointB.x +
				" " +
				rotatedPointB.y +
				" L " +
				rotatedPointC.x +
				" " +
				rotatedPointC.y +
				" L " +
				rotatedPointD.x +
				" " +
				rotatedPointD.y +
				" Z"
			);
		});
	}

	function tickRelationshipsTexts() {
		relationshipText.attr("transform", function (d) {
			var angle = (rotation(d.source, d.target) + 360) % 360,
				mirror = angle > 90 && angle < 270,
				center = { x: 0, y: 0 },
				n = unitaryNormalVector(d.source, d.target),
				nWeight = mirror ? 2 : -3,
				point = {
					x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
					y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
				},
				rotatedPoint = rotatePoint(center, point, angle);

			return (
				"translate(" +
				rotatedPoint.x +
				", " +
				rotatedPoint.y +
				") rotate(" +
				(mirror ? 180 : 0) +
				")"
			);
		});
	}

	function toString(d) {
		var s = d.labels ? d.labels[0] : d.type;

		s += " (<id>: " + d.id;

		Object.keys(d.properties).forEach(function (property) {
			s += ", " + property + ": " + JSON.stringify(d.properties[property]);
		});

		s += ")";

		return s;
	}

	function unitaryNormalVector(source, target, newLength) {
		var center = { x: 0, y: 0 },
			vector = unitaryVector(source, target, newLength);

		return rotatePoint(center, vector, 90);
	}

	function unitaryVector(source, target, newLength) {
		var length =
			Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)) /
			Math.sqrt(newLength || 1);

		return {
			x: (target.x - source.x) / length,
			y: (target.y - source.y) / length
		};
	}

	function updateWithD3Data(d3Data) {
		updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
	}

	function updateWithNeo4jData(neo4jData) {
		var d3Data = neo4jDataToD3Data(neo4jData);
		updateWithD3Data(d3Data);
	}

	function updateInfo(d) {
		clearInfo();

		if (d.labels) {
			appendInfoElementClass("class", d.labels[0]);
		} else {
			appendInfoElementRelationship("class", d.type);
		}

		appendInfoElementProperty("property", "&lt;id&gt;", d.id);

		Object.keys(d.properties).forEach(function (property) {
			appendInfoElementProperty("property", property, JSON.stringify(d.properties[property]));
		});
	}

	function updateNodes(n) {
		Array.prototype.push.apply(nodes, n);

		node = svgNodes.selectAll(".node").data(nodes, function (d) {
			return d.id;
		});
		var nodeEnter = appendNodeToGraph();
		node = nodeEnter.merge(node);
	}

	function updateNodesAndRelationships(n, r) {
		updateRelationships(r);
		updateNodes(n);

		simulation.nodes(nodes);
		simulation.force("link").links(relationships);
	}

	function updateRelationships(r) {
		Array.prototype.push.apply(relationships, r);

		relationship = svgRelationships.selectAll(".relationship").data(relationships, function (d) {
			return d.id;
		});

		var relationshipEnter = appendRelationshipToGraph();

		relationship = relationshipEnter.relationship.merge(relationship);

		relationshipOutline = svg.selectAll(".relationship .outline");
		relationshipOutline = relationshipEnter.outline.merge(relationshipOutline);

		relationshipOverlay = svg.selectAll(".relationship .overlay");
		relationshipOverlay = relationshipEnter.overlay.merge(relationshipOverlay);

		relationshipText = svg.selectAll(".relationship .text");
		relationshipText = relationshipEnter.text.merge(relationshipText);
	}

	function version() {
		return VERSION;
	}

	function zoomFit(transitionDuration) {
		var bounds = svg.node().getBBox(),
			parent = svg.node().parentElement.parentElement,
			fullWidth = parent.clientWidth,
			fullHeight = parent.clientHeight,
			width = bounds.width,
			height = bounds.height,
			midX = bounds.x + width / 2,
			midY = bounds.y + height / 2;

		if (width === 0 || height === 0) {
			return; // nothing to fit
		}

		svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
		svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

		svg.attr(
			"transform",
			"translate(" + svgTranslate[0] + ", " + svgTranslate[1] + ") scale(" + svgScale + ")"
		);
		//        smoothTransform(svgTranslate, svgScale);
	}

	init(_selector, _options);

	return {
		appendRandomDataToNode: appendRandomDataToNode,
		neo4jDataToD3Data: neo4jDataToD3Data,
		randomD3Data: randomD3Data,
		resetWithNeo4jData: resetWithNeo4jData,
		size: size,
		updateWithD3Data: updateWithD3Data,
		updateWithNeo4jData: updateWithNeo4jData,
		version: version
	};
}

module.exports = Neo4jD3;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy8ucG5wbS9icm93c2VyLXBhY2tANi4xLjAvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluL2luZGV4LmpzIiwic3JjL21haW4vc2NyaXB0cy9uZW80amQzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgbmVvNGpkMyA9IHJlcXVpcmUoXCIuL3NjcmlwdHMvbmVvNGpkM1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZW80amQzO1xuIiwiLyogZ2xvYmFsIGQzLCBkb2N1bWVudCAqL1xuLyoganNoaW50IGxhdGVkZWY6bm9mdW5jICovXG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gTmVvNGpEMyhfc2VsZWN0b3IsIF9vcHRpb25zKSB7XG5cdHZhciBjb250YWluZXIsXG5cdFx0Z3JhcGgsXG5cdFx0aW5mbyxcblx0XHRub2RlLFxuXHRcdG5vZGVzLFxuXHRcdHJlbGF0aW9uc2hpcCxcblx0XHRyZWxhdGlvbnNoaXBPdXRsaW5lLFxuXHRcdHJlbGF0aW9uc2hpcE92ZXJsYXksXG5cdFx0cmVsYXRpb25zaGlwVGV4dCxcblx0XHRyZWxhdGlvbnNoaXBzLFxuXHRcdHNlbGVjdG9yLFxuXHRcdHNpbXVsYXRpb24sXG5cdFx0c3ZnLFxuXHRcdHN2Z05vZGVzLFxuXHRcdHN2Z1JlbGF0aW9uc2hpcHMsXG5cdFx0c3ZnU2NhbGUsXG5cdFx0c3ZnVHJhbnNsYXRlLFxuXHRcdGNsYXNzZXMyY29sb3JzID0ge30sXG5cdFx0anVzdExvYWRlZCA9IGZhbHNlLFxuXHRcdG51bUNsYXNzZXMgPSAwLFxuXHRcdG9wdGlvbnMgPSB7XG5cdFx0XHRhcnJvd1NpemU6IDQsXG5cdFx0XHRjb2xvcnM6IGNvbG9ycygpLFxuXHRcdFx0aGlnaGxpZ2h0OiB1bmRlZmluZWQsXG5cdFx0XHRpY29uTWFwOiBmb250QXdlc29tZUljb25zKCksXG5cdFx0XHRpY29uczogdW5kZWZpbmVkLFxuXHRcdFx0aW1hZ2VNYXA6IHt9LFxuXHRcdFx0aW1hZ2VzOiB1bmRlZmluZWQsXG5cdFx0XHRpbmZvUGFuZWw6IHRydWUsXG5cdFx0XHRtaW5Db2xsaXNpb246IHVuZGVmaW5lZCxcblx0XHRcdG5lbzRqRGF0YTogdW5kZWZpbmVkLFxuXHRcdFx0bmVvNGpEYXRhVXJsOiB1bmRlZmluZWQsXG5cdFx0XHRub2RlT3V0bGluZUZpbGxDb2xvcjogdW5kZWZpbmVkLFxuXHRcdFx0bm9kZVJhZGl1czogMjUsXG5cdFx0XHRub2RlVGV4dFByb3BlcnR5OiB1bmRlZmluZWQsXG5cdFx0XHRub2RlVGV4dENvbG9yOiBcIiNmZmZmZmZcIixcblx0XHRcdHJlbGF0aW9uc2hpcENvbG9yOiBcIiNhNWFiYjZcIixcblx0XHRcdHpvb21GaXQ6IGZhbHNlXG5cdFx0fSxcblx0XHRWRVJTSU9OID0gXCIwLjAuMVwiO1xuXG5cdGZ1bmN0aW9uIGFwcGVuZEdyYXBoKGNvbnRhaW5lcikge1xuXHRcdHN2ZyA9IGNvbnRhaW5lclxuXHRcdFx0LmFwcGVuZChcInN2Z1wiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcIm5lbzRqZDMtZ3JhcGhcIilcblx0XHRcdC5jYWxsKFxuXHRcdFx0XHRkMy56b29tKCkub24oXCJ6b29tXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdFx0XHRcdHZhciBzY2FsZSA9IGV2ZW50LnRyYW5zZm9ybS5rLFxuXHRcdFx0XHRcdFx0dHJhbnNsYXRlID0gW2V2ZW50LnRyYW5zZm9ybS54LCBldmVudC50cmFuc2Zvcm0ueV07XG5cblx0XHRcdFx0XHRpZiAoc3ZnVHJhbnNsYXRlKSB7XG5cdFx0XHRcdFx0XHR0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xuXHRcdFx0XHRcdFx0dHJhbnNsYXRlWzFdICs9IHN2Z1RyYW5zbGF0ZVsxXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc3ZnU2NhbGUpIHtcblx0XHRcdFx0XHRcdHNjYWxlICo9IHN2Z1NjYWxlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN2Zy5hdHRyKFxuXHRcdFx0XHRcdFx0XCJ0cmFuc2Zvcm1cIixcblx0XHRcdFx0XHRcdFwidHJhbnNsYXRlKFwiICsgdHJhbnNsYXRlWzBdICsgXCIsIFwiICsgdHJhbnNsYXRlWzFdICsgXCIpIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIlxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0pXG5cdFx0XHQpXG5cdFx0XHQub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXG5cdFx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcblxuXHRcdHN2Z1JlbGF0aW9uc2hpcHMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJyZWxhdGlvbnNoaXBzXCIpO1xuXG5cdFx0c3ZnTm9kZXMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJub2Rlc1wiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEltYWdlVG9Ob2RlKG5vZGUpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmFwcGVuZChcImltYWdlXCIpXG5cdFx0XHQuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gXCI1cHhcIiA6IFwiLTE1cHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIGltYWdlKGQpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiNXB4XCIgOiBcIi0xNnB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpIHtcblx0XHRyZXR1cm4gY29udGFpbmVyLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJuZW80amQzLWluZm9cIik7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG5cdFx0dmFyIGVsZW0gPSBpbmZvLmFwcGVuZChcImFcIik7XG5cblx0XHRlbGVtXG5cdFx0XHQuYXR0cihcImhyZWZcIiwgXCIjXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGNscylcblx0XHRcdC5odG1sKFwiPHN0cm9uZz5cIiArIHByb3BlcnR5ICsgXCI8L3N0cm9uZz5cIiArICh2YWx1ZSA/IFwiOiBcIiArIHZhbHVlIDogXCJcIikpO1xuXG5cdFx0aWYgKCF2YWx1ZSkge1xuXHRcdFx0ZWxlbVxuXHRcdFx0XHQuc3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHRcdD8gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvclxuXHRcdFx0XHRcdFx0OiBpc05vZGVcblx0XHRcdFx0XHRcdD8gY2xhc3MyY29sb3IocHJvcGVydHkpXG5cdFx0XHRcdFx0XHQ6IGRlZmF1bHRDb2xvcigpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuc3R5bGUoXCJib3JkZXItY29sb3JcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvclxuXHRcdFx0XHRcdFx0PyBjbGFzczJkYXJrZW5Db2xvcihvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yKVxuXHRcdFx0XHRcdFx0OiBpc05vZGVcblx0XHRcdFx0XHRcdD8gY2xhc3MyZGFya2VuQ29sb3IocHJvcGVydHkpXG5cdFx0XHRcdFx0XHQ6IGRlZmF1bHREYXJrZW5Db2xvcigpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuc3R5bGUoXCJjb2xvclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yXG5cdFx0XHRcdFx0XHQ/IGNsYXNzMmRhcmtlbkNvbG9yKG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IpXG5cdFx0XHRcdFx0XHQ6IFwiI2ZmZlwiO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudENsYXNzKGNscywgbm9kZSkge1xuXHRcdGFwcGVuZEluZm9FbGVtZW50KGNscywgdHJ1ZSwgbm9kZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KGNscywgcHJvcGVydHksIHZhbHVlKSB7XG5cdFx0YXBwZW5kSW5mb0VsZW1lbnQoY2xzLCBmYWxzZSwgcHJvcGVydHksIHZhbHVlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50UmVsYXRpb25zaGlwKGNscywgcmVsYXRpb25zaGlwKSB7XG5cdFx0YXBwZW5kSW5mb0VsZW1lbnQoY2xzLCBmYWxzZSwgcmVsYXRpb25zaGlwKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE5vZGUoKSB7XG5cdFx0cmV0dXJuIG5vZGVcblx0XHRcdC5lbnRlcigpXG5cdFx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHR2YXIgaGlnaGxpZ2h0LFxuXHRcdFx0XHRcdGksXG5cdFx0XHRcdFx0Y2xhc3NlcyA9IFwibm9kZVwiLFxuXHRcdFx0XHRcdGxhYmVsID0gZC5sYWJlbHNbMF07XG5cblx0XHRcdFx0aWYgKGljb24oZCkpIHtcblx0XHRcdFx0XHRjbGFzc2VzICs9IFwiIG5vZGUtaWNvblwiO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGltYWdlKGQpKSB7XG5cdFx0XHRcdFx0Y2xhc3NlcyArPSBcIiBub2RlLWltYWdlXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3B0aW9ucy5oaWdobGlnaHQpIHtcblx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHQubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdGhpZ2hsaWdodCA9IG9wdGlvbnMuaGlnaGxpZ2h0W2ldO1xuXG5cdFx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRcdGQubGFiZWxzWzBdID09PSBoaWdobGlnaHQuY2xhc3MgJiZcblx0XHRcdFx0XHRcdFx0ZC5wcm9wZXJ0aWVzW2hpZ2hsaWdodC5wcm9wZXJ0eV0gPT09IGhpZ2hsaWdodC52YWx1ZVxuXHRcdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRcdGNsYXNzZXMgKz0gXCIgbm9kZS1oaWdobGlnaHRlZFwiO1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gY2xhc3Nlcztcblx0XHRcdH0pXG5cdFx0XHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRkLmZ4ID0gZC5meSA9IG51bGw7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZUNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRvcHRpb25zLm9uTm9kZUNsaWNrKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0c3RpY2tOb2RlKGQpO1xuXG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEb3VibGVDbGljayA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vbk5vZGVEb3VibGVDbGljayhkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5vbihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHR1cGRhdGVJbmZvKGQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZU1vdXNlRW50ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdG9wdGlvbnMub25Ob2RlTW91c2VFbnRlcihkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5vbihcIm1vdXNlbGVhdmVcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHRjbGVhckluZm8oZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LmNhbGwoZDMuZHJhZygpLm9uKFwic3RhcnRcIiwgZHJhZ1N0YXJ0ZWQpLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKS5vbihcImVuZFwiLCBkcmFnRW5kZWQpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE5vZGVUb0dyYXBoKCkge1xuXHRcdHZhciBuID0gYXBwZW5kTm9kZSgpO1xuXG5cdFx0YXBwZW5kUmluZ1RvTm9kZShuKTtcblx0XHRhcHBlbmRPdXRsaW5lVG9Ob2RlKG4pO1xuXG5cdFx0aWYgKG9wdGlvbnMuaWNvbnMpIHtcblx0XHRcdGFwcGVuZFRleHRUb05vZGUobik7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG5cdFx0XHRhcHBlbmRJbWFnZVRvTm9kZShuKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb05vZGUobm9kZSkge1xuXHRcdHJldHVybiBub2RlXG5cdFx0XHQuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwib3V0bGluZVwiKVxuXHRcdFx0LmF0dHIoXCJyXCIsIG9wdGlvbnMubm9kZVJhZGl1cylcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ6IGNsYXNzMmNvbG9yKGQubGFiZWxzWzBdKTtcblx0XHRcdH0pXG5cdFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ/IGNsYXNzMmRhcmtlbkNvbG9yKG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IpXG5cdFx0XHRcdFx0OiBjbGFzczJkYXJrZW5Db2xvcihkLmxhYmVsc1swXSk7XG5cdFx0XHR9KVxuXHRcdFx0LmFwcGVuZChcInRpdGxlXCIpXG5cdFx0XHQudGV4dChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gdG9TdHJpbmcoZCk7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJpbmdUb05vZGUobm9kZSkge1xuXHRcdHJldHVybiBub2RlXG5cdFx0XHQuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicmluZ1wiKVxuXHRcdFx0LmF0dHIoXCJyXCIsIG9wdGlvbnMubm9kZVJhZGl1cyAqIDEuMTYpXG5cdFx0XHQuYXBwZW5kKFwidGl0bGVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiB0b1N0cmluZyhkKTtcblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kVGV4dFRvTm9kZShub2RlKSB7XG5cdFx0cmV0dXJuIG5vZGVcblx0XHRcdC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBcInRleHRcIiArIChpY29uKGQpID8gXCIgaWNvblwiIDogXCJcIik7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIG9wdGlvbnMubm9kZVRleHRDb2xvcilcblx0XHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gb3B0aW9ucy5ub2RlUmFkaXVzICsgXCJweFwiIDogXCIxMHB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IHBhcnNlSW50KE1hdGgucm91bmQob3B0aW9ucy5ub2RlUmFkaXVzICogMC4zMikpICsgXCJweFwiIDogXCI0cHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuaHRtbChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRjb25zdCBfaWNvbiA9IGljb24oZCk7XG5cdFx0XHRcdGxldCB0ZXh0ID0gZC5pZDtcblx0XHRcdFx0aWYgKG9wdGlvbnMubm9kZVRleHRQcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHRleHQgPSBkLnByb3BlcnRpZXNbb3B0aW9ucy5ub2RlVGV4dFByb3BlcnR5XTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBfaWNvbiA/IFwiJiN4XCIgKyBfaWNvbiA6IHRleHQ7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJhbmRvbURhdGFUb05vZGUoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKSB7XG5cdFx0dmFyIGRhdGEgPSByYW5kb21EM0RhdGEoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKTtcblx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kUmVsYXRpb25zaGlwKCkge1xuXHRcdHJldHVybiByZWxhdGlvbnNoaXBcblx0XHRcdC5lbnRlcigpXG5cdFx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInJlbGF0aW9uc2hpcFwiKVxuXHRcdFx0Lm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2sgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdG9wdGlvbnMub25SZWxhdGlvbnNoaXBEb3VibGVDbGljayhkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5vbihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHR1cGRhdGVJbmZvKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyKSB7XG5cdFx0cmV0dXJuIHIuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvdXRsaW5lXCIpLmF0dHIoXCJmaWxsXCIsIFwiI2E1YWJiNlwiKS5hdHRyKFwic3Ryb2tlXCIsIFwibm9uZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyKSB7XG5cdFx0cmV0dXJuIHIuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvdmVybGF5XCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHIpIHtcblx0XHRyZXR1cm4gclxuXHRcdFx0LmFwcGVuZChcInRleHRcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0ZXh0XCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCIjMDAwMDAwXCIpXG5cdFx0XHQuYXR0cihcImZvbnQtc2l6ZVwiLCBcIjhweFwiKVxuXHRcdFx0LmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBkLnR5cGU7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgoKSB7XG5cdFx0dmFyIHJlbGF0aW9uc2hpcCA9IGFwcGVuZFJlbGF0aW9uc2hpcCgpLFxuXHRcdFx0dGV4dCA9IGFwcGVuZFRleHRUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApLFxuXHRcdFx0b3V0bGluZSA9IGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApLFxuXHRcdFx0b3ZlcmxheSA9IGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdG91dGxpbmU6IG91dGxpbmUsXG5cdFx0XHRvdmVybGF5OiBvdmVybGF5LFxuXHRcdFx0cmVsYXRpb25zaGlwOiByZWxhdGlvbnNoaXAsXG5cdFx0XHR0ZXh0OiB0ZXh0XG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNsYXNzMmNvbG9yKGNscykge1xuXHRcdHZhciBjb2xvciA9IGNsYXNzZXMyY29sb3JzW2Nsc107XG5cblx0XHRpZiAoIWNvbG9yKSB7XG5cdFx0XHQvLyAgICAgICAgICAgIGNvbG9yID0gb3B0aW9ucy5jb2xvcnNbTWF0aC5taW4obnVtQ2xhc3Nlcywgb3B0aW9ucy5jb2xvcnMubGVuZ3RoIC0gMSldO1xuXHRcdFx0Y29sb3IgPSBvcHRpb25zLmNvbG9yc1tudW1DbGFzc2VzICUgb3B0aW9ucy5jb2xvcnMubGVuZ3RoXTtcblx0XHRcdGNsYXNzZXMyY29sb3JzW2Nsc10gPSBjb2xvcjtcblx0XHRcdG51bUNsYXNzZXMrKztcblx0XHR9XG5cblx0XHRyZXR1cm4gY29sb3I7XG5cdH1cblxuXHRmdW5jdGlvbiBjbGFzczJkYXJrZW5Db2xvcihjbHMpIHtcblx0XHRyZXR1cm4gZDMucmdiKGNsYXNzMmNvbG9yKGNscykpLmRhcmtlcigxKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNsZWFySW5mbygpIHtcblx0XHRpbmZvLmh0bWwoXCJcIik7XG5cdH1cblxuXHRmdW5jdGlvbiBjb2xvcigpIHtcblx0XHRyZXR1cm4gb3B0aW9ucy5jb2xvcnNbKG9wdGlvbnMuY29sb3JzLmxlbmd0aCAqIE1hdGgucmFuZG9tKCkpIDw8IDBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29sb3JzKCkge1xuXHRcdC8vIGQzLnNjaGVtZUNhdGVnb3J5MTAsXG5cdFx0Ly8gZDMuc2NoZW1lQ2F0ZWdvcnkyMCxcblx0XHRyZXR1cm4gW1xuXHRcdFx0XCIjNjhiZGY2XCIsIC8vIGxpZ2h0IGJsdWVcblx0XHRcdFwiIzZkY2U5ZVwiLCAvLyBncmVlbiAjMVxuXHRcdFx0XCIjZmFhZmMyXCIsIC8vIGxpZ2h0IHBpbmtcblx0XHRcdFwiI2YyYmFmNlwiLCAvLyBwdXJwbGVcblx0XHRcdFwiI2ZmOTI4Y1wiLCAvLyBsaWdodCByZWRcblx0XHRcdFwiI2ZjZWE3ZVwiLCAvLyBsaWdodCB5ZWxsb3dcblx0XHRcdFwiI2ZmYzc2NlwiLCAvLyBsaWdodCBvcmFuZ2Vcblx0XHRcdFwiIzQwNWY5ZVwiLCAvLyBuYXZ5IGJsdWVcblx0XHRcdFwiI2E1YWJiNlwiLCAvLyBkYXJrIGdyYXlcblx0XHRcdFwiIzc4Y2VjYlwiLCAvLyBncmVlbiAjMixcblx0XHRcdFwiI2I4OGNiYlwiLCAvLyBkYXJrIHB1cnBsZVxuXHRcdFx0XCIjY2VkMmQ5XCIsIC8vIGxpZ2h0IGdyYXlcblx0XHRcdFwiI2U4NDY0NlwiLCAvLyBkYXJrIHJlZFxuXHRcdFx0XCIjZmE1Zjg2XCIsIC8vIGRhcmsgcGlua1xuXHRcdFx0XCIjZmZhYjFhXCIsIC8vIGRhcmsgb3JhbmdlXG5cdFx0XHRcIiNmY2RhMTlcIiwgLy8gZGFyayB5ZWxsb3dcblx0XHRcdFwiIzc5N2I4MFwiLCAvLyBibGFja1xuXHRcdFx0XCIjYzlkOTZmXCIsIC8vIHBpc3RhY2NoaW9cblx0XHRcdFwiIzQ3OTkxZlwiLCAvLyBncmVlbiAjM1xuXHRcdFx0XCIjNzBlZGVlXCIsIC8vIHR1cnF1b2lzZVxuXHRcdFx0XCIjZmY3NWVhXCIgLy8gcGlua1xuXHRcdF07XG5cdH1cblxuXHRmdW5jdGlvbiBjb250YWlucyhhcnJheSwgaWQpIHtcblx0XHR2YXIgZmlsdGVyID0gYXJyYXkuZmlsdGVyKGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0XHRyZXR1cm4gZWxlbS5pZCA9PT0gaWQ7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZmlsdGVyLmxlbmd0aCA+IDA7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWZhdWx0Q29sb3IoKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMucmVsYXRpb25zaGlwQ29sb3I7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWZhdWx0RGFya2VuQ29sb3IoKSB7XG5cdFx0cmV0dXJuIGQzLnJnYihvcHRpb25zLmNvbG9yc1tvcHRpb25zLmNvbG9ycy5sZW5ndGggLSAxXSkuZGFya2VyKDEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ0VuZGVkKGQpIHtcblx0XHRpZiAoIWQzLmV2ZW50LmFjdGl2ZSkge1xuXHRcdFx0c2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ0VuZCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRvcHRpb25zLm9uTm9kZURyYWdFbmQoZCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ2dlZChkKSB7XG5cdFx0c3RpY2tOb2RlKGQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ1N0YXJ0ZWQoZCkge1xuXHRcdGlmICghZDMuZXZlbnQuYWN0aXZlKSB7XG5cdFx0XHRzaW11bGF0aW9uLmFscGhhVGFyZ2V0KDAuMykucmVzdGFydCgpO1xuXHRcdH1cblxuXHRcdGQuZnggPSBkLng7XG5cdFx0ZC5meSA9IGQueTtcblxuXHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5vbk5vZGVEcmFnU3RhcnQgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0b3B0aW9ucy5vbk5vZGVEcmFnU3RhcnQoZCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG9iajEsIG9iajIpIHtcblx0XHR2YXIgb2JqID0ge307XG5cblx0XHRtZXJnZShvYmosIG9iajEpO1xuXHRcdG1lcmdlKG9iaiwgb2JqMik7XG5cblx0XHRyZXR1cm4gb2JqO1xuXHR9XG5cblx0ZnVuY3Rpb24gZm9udEF3ZXNvbWVJY29ucygpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Z2xhc3M6IFwiZjAwMFwiLFxuXHRcdFx0bXVzaWM6IFwiZjAwMVwiLFxuXHRcdFx0c2VhcmNoOiBcImYwMDJcIixcblx0XHRcdFwiZW52ZWxvcGUtb1wiOiBcImYwMDNcIixcblx0XHRcdGhlYXJ0OiBcImYwMDRcIixcblx0XHRcdHN0YXI6IFwiZjAwNVwiLFxuXHRcdFx0XCJzdGFyLW9cIjogXCJmMDA2XCIsXG5cdFx0XHR1c2VyOiBcImYwMDdcIixcblx0XHRcdGZpbG06IFwiZjAwOFwiLFxuXHRcdFx0XCJ0aC1sYXJnZVwiOiBcImYwMDlcIixcblx0XHRcdHRoOiBcImYwMGFcIixcblx0XHRcdFwidGgtbGlzdFwiOiBcImYwMGJcIixcblx0XHRcdGNoZWNrOiBcImYwMGNcIixcblx0XHRcdFwicmVtb3ZlLGNsb3NlLHRpbWVzXCI6IFwiZjAwZFwiLFxuXHRcdFx0XCJzZWFyY2gtcGx1c1wiOiBcImYwMGVcIixcblx0XHRcdFwic2VhcmNoLW1pbnVzXCI6IFwiZjAxMFwiLFxuXHRcdFx0XCJwb3dlci1vZmZcIjogXCJmMDExXCIsXG5cdFx0XHRzaWduYWw6IFwiZjAxMlwiLFxuXHRcdFx0XCJnZWFyLGNvZ1wiOiBcImYwMTNcIixcblx0XHRcdFwidHJhc2gtb1wiOiBcImYwMTRcIixcblx0XHRcdGhvbWU6IFwiZjAxNVwiLFxuXHRcdFx0XCJmaWxlLW9cIjogXCJmMDE2XCIsXG5cdFx0XHRcImNsb2NrLW9cIjogXCJmMDE3XCIsXG5cdFx0XHRyb2FkOiBcImYwMThcIixcblx0XHRcdGRvd25sb2FkOiBcImYwMTlcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLW8tZG93blwiOiBcImYwMWFcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLW8tdXBcIjogXCJmMDFiXCIsXG5cdFx0XHRpbmJveDogXCJmMDFjXCIsXG5cdFx0XHRcInBsYXktY2lyY2xlLW9cIjogXCJmMDFkXCIsXG5cdFx0XHRcInJvdGF0ZS1yaWdodCxyZXBlYXRcIjogXCJmMDFlXCIsXG5cdFx0XHRyZWZyZXNoOiBcImYwMjFcIixcblx0XHRcdFwibGlzdC1hbHRcIjogXCJmMDIyXCIsXG5cdFx0XHRsb2NrOiBcImYwMjNcIixcblx0XHRcdGZsYWc6IFwiZjAyNFwiLFxuXHRcdFx0aGVhZHBob25lczogXCJmMDI1XCIsXG5cdFx0XHRcInZvbHVtZS1vZmZcIjogXCJmMDI2XCIsXG5cdFx0XHRcInZvbHVtZS1kb3duXCI6IFwiZjAyN1wiLFxuXHRcdFx0XCJ2b2x1bWUtdXBcIjogXCJmMDI4XCIsXG5cdFx0XHRxcmNvZGU6IFwiZjAyOVwiLFxuXHRcdFx0YmFyY29kZTogXCJmMDJhXCIsXG5cdFx0XHR0YWc6IFwiZjAyYlwiLFxuXHRcdFx0dGFnczogXCJmMDJjXCIsXG5cdFx0XHRib29rOiBcImYwMmRcIixcblx0XHRcdGJvb2ttYXJrOiBcImYwMmVcIixcblx0XHRcdHByaW50OiBcImYwMmZcIixcblx0XHRcdGNhbWVyYTogXCJmMDMwXCIsXG5cdFx0XHRmb250OiBcImYwMzFcIixcblx0XHRcdGJvbGQ6IFwiZjAzMlwiLFxuXHRcdFx0aXRhbGljOiBcImYwMzNcIixcblx0XHRcdFwidGV4dC1oZWlnaHRcIjogXCJmMDM0XCIsXG5cdFx0XHRcInRleHQtd2lkdGhcIjogXCJmMDM1XCIsXG5cdFx0XHRcImFsaWduLWxlZnRcIjogXCJmMDM2XCIsXG5cdFx0XHRcImFsaWduLWNlbnRlclwiOiBcImYwMzdcIixcblx0XHRcdFwiYWxpZ24tcmlnaHRcIjogXCJmMDM4XCIsXG5cdFx0XHRcImFsaWduLWp1c3RpZnlcIjogXCJmMDM5XCIsXG5cdFx0XHRsaXN0OiBcImYwM2FcIixcblx0XHRcdFwiZGVkZW50LG91dGRlbnRcIjogXCJmMDNiXCIsXG5cdFx0XHRpbmRlbnQ6IFwiZjAzY1wiLFxuXHRcdFx0XCJ2aWRlby1jYW1lcmFcIjogXCJmMDNkXCIsXG5cdFx0XHRcInBob3RvLGltYWdlLHBpY3R1cmUtb1wiOiBcImYwM2VcIixcblx0XHRcdHBlbmNpbDogXCJmMDQwXCIsXG5cdFx0XHRcIm1hcC1tYXJrZXJcIjogXCJmMDQxXCIsXG5cdFx0XHRhZGp1c3Q6IFwiZjA0MlwiLFxuXHRcdFx0dGludDogXCJmMDQzXCIsXG5cdFx0XHRcImVkaXQscGVuY2lsLXNxdWFyZS1vXCI6IFwiZjA0NFwiLFxuXHRcdFx0XCJzaGFyZS1zcXVhcmUtb1wiOiBcImYwNDVcIixcblx0XHRcdFwiY2hlY2stc3F1YXJlLW9cIjogXCJmMDQ2XCIsXG5cdFx0XHRhcnJvd3M6IFwiZjA0N1wiLFxuXHRcdFx0XCJzdGVwLWJhY2t3YXJkXCI6IFwiZjA0OFwiLFxuXHRcdFx0XCJmYXN0LWJhY2t3YXJkXCI6IFwiZjA0OVwiLFxuXHRcdFx0YmFja3dhcmQ6IFwiZjA0YVwiLFxuXHRcdFx0cGxheTogXCJmMDRiXCIsXG5cdFx0XHRwYXVzZTogXCJmMDRjXCIsXG5cdFx0XHRzdG9wOiBcImYwNGRcIixcblx0XHRcdGZvcndhcmQ6IFwiZjA0ZVwiLFxuXHRcdFx0XCJmYXN0LWZvcndhcmRcIjogXCJmMDUwXCIsXG5cdFx0XHRcInN0ZXAtZm9yd2FyZFwiOiBcImYwNTFcIixcblx0XHRcdGVqZWN0OiBcImYwNTJcIixcblx0XHRcdFwiY2hldnJvbi1sZWZ0XCI6IFwiZjA1M1wiLFxuXHRcdFx0XCJjaGV2cm9uLXJpZ2h0XCI6IFwiZjA1NFwiLFxuXHRcdFx0XCJwbHVzLWNpcmNsZVwiOiBcImYwNTVcIixcblx0XHRcdFwibWludXMtY2lyY2xlXCI6IFwiZjA1NlwiLFxuXHRcdFx0XCJ0aW1lcy1jaXJjbGVcIjogXCJmMDU3XCIsXG5cdFx0XHRcImNoZWNrLWNpcmNsZVwiOiBcImYwNThcIixcblx0XHRcdFwicXVlc3Rpb24tY2lyY2xlXCI6IFwiZjA1OVwiLFxuXHRcdFx0XCJpbmZvLWNpcmNsZVwiOiBcImYwNWFcIixcblx0XHRcdGNyb3NzaGFpcnM6IFwiZjA1YlwiLFxuXHRcdFx0XCJ0aW1lcy1jaXJjbGUtb1wiOiBcImYwNWNcIixcblx0XHRcdFwiY2hlY2stY2lyY2xlLW9cIjogXCJmMDVkXCIsXG5cdFx0XHRiYW46IFwiZjA1ZVwiLFxuXHRcdFx0XCJhcnJvdy1sZWZ0XCI6IFwiZjA2MFwiLFxuXHRcdFx0XCJhcnJvdy1yaWdodFwiOiBcImYwNjFcIixcblx0XHRcdFwiYXJyb3ctdXBcIjogXCJmMDYyXCIsXG5cdFx0XHRcImFycm93LWRvd25cIjogXCJmMDYzXCIsXG5cdFx0XHRcIm1haWwtZm9yd2FyZCxzaGFyZVwiOiBcImYwNjRcIixcblx0XHRcdGV4cGFuZDogXCJmMDY1XCIsXG5cdFx0XHRjb21wcmVzczogXCJmMDY2XCIsXG5cdFx0XHRwbHVzOiBcImYwNjdcIixcblx0XHRcdG1pbnVzOiBcImYwNjhcIixcblx0XHRcdGFzdGVyaXNrOiBcImYwNjlcIixcblx0XHRcdFwiZXhjbGFtYXRpb24tY2lyY2xlXCI6IFwiZjA2YVwiLFxuXHRcdFx0Z2lmdDogXCJmMDZiXCIsXG5cdFx0XHRsZWFmOiBcImYwNmNcIixcblx0XHRcdGZpcmU6IFwiZjA2ZFwiLFxuXHRcdFx0ZXllOiBcImYwNmVcIixcblx0XHRcdFwiZXllLXNsYXNoXCI6IFwiZjA3MFwiLFxuXHRcdFx0XCJ3YXJuaW5nLGV4Y2xhbWF0aW9uLXRyaWFuZ2xlXCI6IFwiZjA3MVwiLFxuXHRcdFx0cGxhbmU6IFwiZjA3MlwiLFxuXHRcdFx0Y2FsZW5kYXI6IFwiZjA3M1wiLFxuXHRcdFx0cmFuZG9tOiBcImYwNzRcIixcblx0XHRcdGNvbW1lbnQ6IFwiZjA3NVwiLFxuXHRcdFx0bWFnbmV0OiBcImYwNzZcIixcblx0XHRcdFwiY2hldnJvbi11cFwiOiBcImYwNzdcIixcblx0XHRcdFwiY2hldnJvbi1kb3duXCI6IFwiZjA3OFwiLFxuXHRcdFx0cmV0d2VldDogXCJmMDc5XCIsXG5cdFx0XHRcInNob3BwaW5nLWNhcnRcIjogXCJmMDdhXCIsXG5cdFx0XHRmb2xkZXI6IFwiZjA3YlwiLFxuXHRcdFx0XCJmb2xkZXItb3BlblwiOiBcImYwN2NcIixcblx0XHRcdFwiYXJyb3dzLXZcIjogXCJmMDdkXCIsXG5cdFx0XHRcImFycm93cy1oXCI6IFwiZjA3ZVwiLFxuXHRcdFx0XCJiYXItY2hhcnQtbyxiYXItY2hhcnRcIjogXCJmMDgwXCIsXG5cdFx0XHRcInR3aXR0ZXItc3F1YXJlXCI6IFwiZjA4MVwiLFxuXHRcdFx0XCJmYWNlYm9vay1zcXVhcmVcIjogXCJmMDgyXCIsXG5cdFx0XHRcImNhbWVyYS1yZXRyb1wiOiBcImYwODNcIixcblx0XHRcdGtleTogXCJmMDg0XCIsXG5cdFx0XHRcImdlYXJzLGNvZ3NcIjogXCJmMDg1XCIsXG5cdFx0XHRjb21tZW50czogXCJmMDg2XCIsXG5cdFx0XHRcInRodW1icy1vLXVwXCI6IFwiZjA4N1wiLFxuXHRcdFx0XCJ0aHVtYnMtby1kb3duXCI6IFwiZjA4OFwiLFxuXHRcdFx0XCJzdGFyLWhhbGZcIjogXCJmMDg5XCIsXG5cdFx0XHRcImhlYXJ0LW9cIjogXCJmMDhhXCIsXG5cdFx0XHRcInNpZ24tb3V0XCI6IFwiZjA4YlwiLFxuXHRcdFx0XCJsaW5rZWRpbi1zcXVhcmVcIjogXCJmMDhjXCIsXG5cdFx0XHRcInRodW1iLXRhY2tcIjogXCJmMDhkXCIsXG5cdFx0XHRcImV4dGVybmFsLWxpbmtcIjogXCJmMDhlXCIsXG5cdFx0XHRcInNpZ24taW5cIjogXCJmMDkwXCIsXG5cdFx0XHR0cm9waHk6IFwiZjA5MVwiLFxuXHRcdFx0XCJnaXRodWItc3F1YXJlXCI6IFwiZjA5MlwiLFxuXHRcdFx0dXBsb2FkOiBcImYwOTNcIixcblx0XHRcdFwibGVtb24tb1wiOiBcImYwOTRcIixcblx0XHRcdHBob25lOiBcImYwOTVcIixcblx0XHRcdFwic3F1YXJlLW9cIjogXCJmMDk2XCIsXG5cdFx0XHRcImJvb2ttYXJrLW9cIjogXCJmMDk3XCIsXG5cdFx0XHRcInBob25lLXNxdWFyZVwiOiBcImYwOThcIixcblx0XHRcdHR3aXR0ZXI6IFwiZjA5OVwiLFxuXHRcdFx0XCJmYWNlYm9vay1mLGZhY2Vib29rXCI6IFwiZjA5YVwiLFxuXHRcdFx0Z2l0aHViOiBcImYwOWJcIixcblx0XHRcdHVubG9jazogXCJmMDljXCIsXG5cdFx0XHRcImNyZWRpdC1jYXJkXCI6IFwiZjA5ZFwiLFxuXHRcdFx0XCJmZWVkLHJzc1wiOiBcImYwOWVcIixcblx0XHRcdFwiaGRkLW9cIjogXCJmMGEwXCIsXG5cdFx0XHRidWxsaG9ybjogXCJmMGExXCIsXG5cdFx0XHRiZWxsOiBcImYwZjNcIixcblx0XHRcdGNlcnRpZmljYXRlOiBcImYwYTNcIixcblx0XHRcdFwiaGFuZC1vLXJpZ2h0XCI6IFwiZjBhNFwiLFxuXHRcdFx0XCJoYW5kLW8tbGVmdFwiOiBcImYwYTVcIixcblx0XHRcdFwiaGFuZC1vLXVwXCI6IFwiZjBhNlwiLFxuXHRcdFx0XCJoYW5kLW8tZG93blwiOiBcImYwYTdcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLWxlZnRcIjogXCJmMGE4XCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1yaWdodFwiOiBcImYwYTlcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLXVwXCI6IFwiZjBhYVwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtZG93blwiOiBcImYwYWJcIixcblx0XHRcdGdsb2JlOiBcImYwYWNcIixcblx0XHRcdHdyZW5jaDogXCJmMGFkXCIsXG5cdFx0XHR0YXNrczogXCJmMGFlXCIsXG5cdFx0XHRmaWx0ZXI6IFwiZjBiMFwiLFxuXHRcdFx0YnJpZWZjYXNlOiBcImYwYjFcIixcblx0XHRcdFwiYXJyb3dzLWFsdFwiOiBcImYwYjJcIixcblx0XHRcdFwiZ3JvdXAsdXNlcnNcIjogXCJmMGMwXCIsXG5cdFx0XHRcImNoYWluLGxpbmtcIjogXCJmMGMxXCIsXG5cdFx0XHRjbG91ZDogXCJmMGMyXCIsXG5cdFx0XHRmbGFzazogXCJmMGMzXCIsXG5cdFx0XHRcImN1dCxzY2lzc29yc1wiOiBcImYwYzRcIixcblx0XHRcdFwiY29weSxmaWxlcy1vXCI6IFwiZjBjNVwiLFxuXHRcdFx0cGFwZXJjbGlwOiBcImYwYzZcIixcblx0XHRcdFwic2F2ZSxmbG9wcHktb1wiOiBcImYwYzdcIixcblx0XHRcdHNxdWFyZTogXCJmMGM4XCIsXG5cdFx0XHRcIm5hdmljb24scmVvcmRlcixiYXJzXCI6IFwiZjBjOVwiLFxuXHRcdFx0XCJsaXN0LXVsXCI6IFwiZjBjYVwiLFxuXHRcdFx0XCJsaXN0LW9sXCI6IFwiZjBjYlwiLFxuXHRcdFx0c3RyaWtldGhyb3VnaDogXCJmMGNjXCIsXG5cdFx0XHR1bmRlcmxpbmU6IFwiZjBjZFwiLFxuXHRcdFx0dGFibGU6IFwiZjBjZVwiLFxuXHRcdFx0bWFnaWM6IFwiZjBkMFwiLFxuXHRcdFx0dHJ1Y2s6IFwiZjBkMVwiLFxuXHRcdFx0cGludGVyZXN0OiBcImYwZDJcIixcblx0XHRcdFwicGludGVyZXN0LXNxdWFyZVwiOiBcImYwZDNcIixcblx0XHRcdFwiZ29vZ2xlLXBsdXMtc3F1YXJlXCI6IFwiZjBkNFwiLFxuXHRcdFx0XCJnb29nbGUtcGx1c1wiOiBcImYwZDVcIixcblx0XHRcdG1vbmV5OiBcImYwZDZcIixcblx0XHRcdFwiY2FyZXQtZG93blwiOiBcImYwZDdcIixcblx0XHRcdFwiY2FyZXQtdXBcIjogXCJmMGQ4XCIsXG5cdFx0XHRcImNhcmV0LWxlZnRcIjogXCJmMGQ5XCIsXG5cdFx0XHRcImNhcmV0LXJpZ2h0XCI6IFwiZjBkYVwiLFxuXHRcdFx0Y29sdW1uczogXCJmMGRiXCIsXG5cdFx0XHRcInVuc29ydGVkLHNvcnRcIjogXCJmMGRjXCIsXG5cdFx0XHRcInNvcnQtZG93bixzb3J0LWRlc2NcIjogXCJmMGRkXCIsXG5cdFx0XHRcInNvcnQtdXAsc29ydC1hc2NcIjogXCJmMGRlXCIsXG5cdFx0XHRlbnZlbG9wZTogXCJmMGUwXCIsXG5cdFx0XHRsaW5rZWRpbjogXCJmMGUxXCIsXG5cdFx0XHRcInJvdGF0ZS1sZWZ0LHVuZG9cIjogXCJmMGUyXCIsXG5cdFx0XHRcImxlZ2FsLGdhdmVsXCI6IFwiZjBlM1wiLFxuXHRcdFx0XCJkYXNoYm9hcmQsdGFjaG9tZXRlclwiOiBcImYwZTRcIixcblx0XHRcdFwiY29tbWVudC1vXCI6IFwiZjBlNVwiLFxuXHRcdFx0XCJjb21tZW50cy1vXCI6IFwiZjBlNlwiLFxuXHRcdFx0XCJmbGFzaCxib2x0XCI6IFwiZjBlN1wiLFxuXHRcdFx0c2l0ZW1hcDogXCJmMGU4XCIsXG5cdFx0XHR1bWJyZWxsYTogXCJmMGU5XCIsXG5cdFx0XHRcInBhc3RlLGNsaXBib2FyZFwiOiBcImYwZWFcIixcblx0XHRcdFwibGlnaHRidWxiLW9cIjogXCJmMGViXCIsXG5cdFx0XHRleGNoYW5nZTogXCJmMGVjXCIsXG5cdFx0XHRcImNsb3VkLWRvd25sb2FkXCI6IFwiZjBlZFwiLFxuXHRcdFx0XCJjbG91ZC11cGxvYWRcIjogXCJmMGVlXCIsXG5cdFx0XHRcInVzZXItbWRcIjogXCJmMGYwXCIsXG5cdFx0XHRzdGV0aG9zY29wZTogXCJmMGYxXCIsXG5cdFx0XHRzdWl0Y2FzZTogXCJmMGYyXCIsXG5cdFx0XHRcImJlbGwtb1wiOiBcImYwYTJcIixcblx0XHRcdGNvZmZlZTogXCJmMGY0XCIsXG5cdFx0XHRjdXRsZXJ5OiBcImYwZjVcIixcblx0XHRcdFwiZmlsZS10ZXh0LW9cIjogXCJmMGY2XCIsXG5cdFx0XHRcImJ1aWxkaW5nLW9cIjogXCJmMGY3XCIsXG5cdFx0XHRcImhvc3BpdGFsLW9cIjogXCJmMGY4XCIsXG5cdFx0XHRhbWJ1bGFuY2U6IFwiZjBmOVwiLFxuXHRcdFx0bWVka2l0OiBcImYwZmFcIixcblx0XHRcdFwiZmlnaHRlci1qZXRcIjogXCJmMGZiXCIsXG5cdFx0XHRiZWVyOiBcImYwZmNcIixcblx0XHRcdFwiaC1zcXVhcmVcIjogXCJmMGZkXCIsXG5cdFx0XHRcInBsdXMtc3F1YXJlXCI6IFwiZjBmZVwiLFxuXHRcdFx0XCJhbmdsZS1kb3VibGUtbGVmdFwiOiBcImYxMDBcIixcblx0XHRcdFwiYW5nbGUtZG91YmxlLXJpZ2h0XCI6IFwiZjEwMVwiLFxuXHRcdFx0XCJhbmdsZS1kb3VibGUtdXBcIjogXCJmMTAyXCIsXG5cdFx0XHRcImFuZ2xlLWRvdWJsZS1kb3duXCI6IFwiZjEwM1wiLFxuXHRcdFx0XCJhbmdsZS1sZWZ0XCI6IFwiZjEwNFwiLFxuXHRcdFx0XCJhbmdsZS1yaWdodFwiOiBcImYxMDVcIixcblx0XHRcdFwiYW5nbGUtdXBcIjogXCJmMTA2XCIsXG5cdFx0XHRcImFuZ2xlLWRvd25cIjogXCJmMTA3XCIsXG5cdFx0XHRkZXNrdG9wOiBcImYxMDhcIixcblx0XHRcdGxhcHRvcDogXCJmMTA5XCIsXG5cdFx0XHR0YWJsZXQ6IFwiZjEwYVwiLFxuXHRcdFx0XCJtb2JpbGUtcGhvbmUsbW9iaWxlXCI6IFwiZjEwYlwiLFxuXHRcdFx0XCJjaXJjbGUtb1wiOiBcImYxMGNcIixcblx0XHRcdFwicXVvdGUtbGVmdFwiOiBcImYxMGRcIixcblx0XHRcdFwicXVvdGUtcmlnaHRcIjogXCJmMTBlXCIsXG5cdFx0XHRzcGlubmVyOiBcImYxMTBcIixcblx0XHRcdGNpcmNsZTogXCJmMTExXCIsXG5cdFx0XHRcIm1haWwtcmVwbHkscmVwbHlcIjogXCJmMTEyXCIsXG5cdFx0XHRcImdpdGh1Yi1hbHRcIjogXCJmMTEzXCIsXG5cdFx0XHRcImZvbGRlci1vXCI6IFwiZjExNFwiLFxuXHRcdFx0XCJmb2xkZXItb3Blbi1vXCI6IFwiZjExNVwiLFxuXHRcdFx0XCJzbWlsZS1vXCI6IFwiZjExOFwiLFxuXHRcdFx0XCJmcm93bi1vXCI6IFwiZjExOVwiLFxuXHRcdFx0XCJtZWgtb1wiOiBcImYxMWFcIixcblx0XHRcdGdhbWVwYWQ6IFwiZjExYlwiLFxuXHRcdFx0XCJrZXlib2FyZC1vXCI6IFwiZjExY1wiLFxuXHRcdFx0XCJmbGFnLW9cIjogXCJmMTFkXCIsXG5cdFx0XHRcImZsYWctY2hlY2tlcmVkXCI6IFwiZjExZVwiLFxuXHRcdFx0dGVybWluYWw6IFwiZjEyMFwiLFxuXHRcdFx0Y29kZTogXCJmMTIxXCIsXG5cdFx0XHRcIm1haWwtcmVwbHktYWxsLHJlcGx5LWFsbFwiOiBcImYxMjJcIixcblx0XHRcdFwic3Rhci1oYWxmLWVtcHR5LHN0YXItaGFsZi1mdWxsLHN0YXItaGFsZi1vXCI6IFwiZjEyM1wiLFxuXHRcdFx0XCJsb2NhdGlvbi1hcnJvd1wiOiBcImYxMjRcIixcblx0XHRcdGNyb3A6IFwiZjEyNVwiLFxuXHRcdFx0XCJjb2RlLWZvcmtcIjogXCJmMTI2XCIsXG5cdFx0XHRcInVubGluayxjaGFpbi1icm9rZW5cIjogXCJmMTI3XCIsXG5cdFx0XHRxdWVzdGlvbjogXCJmMTI4XCIsXG5cdFx0XHRpbmZvOiBcImYxMjlcIixcblx0XHRcdGV4Y2xhbWF0aW9uOiBcImYxMmFcIixcblx0XHRcdHN1cGVyc2NyaXB0OiBcImYxMmJcIixcblx0XHRcdHN1YnNjcmlwdDogXCJmMTJjXCIsXG5cdFx0XHRlcmFzZXI6IFwiZjEyZFwiLFxuXHRcdFx0XCJwdXp6bGUtcGllY2VcIjogXCJmMTJlXCIsXG5cdFx0XHRtaWNyb3Bob25lOiBcImYxMzBcIixcblx0XHRcdFwibWljcm9waG9uZS1zbGFzaFwiOiBcImYxMzFcIixcblx0XHRcdHNoaWVsZDogXCJmMTMyXCIsXG5cdFx0XHRcImNhbGVuZGFyLW9cIjogXCJmMTMzXCIsXG5cdFx0XHRcImZpcmUtZXh0aW5ndWlzaGVyXCI6IFwiZjEzNFwiLFxuXHRcdFx0cm9ja2V0OiBcImYxMzVcIixcblx0XHRcdG1heGNkbjogXCJmMTM2XCIsXG5cdFx0XHRcImNoZXZyb24tY2lyY2xlLWxlZnRcIjogXCJmMTM3XCIsXG5cdFx0XHRcImNoZXZyb24tY2lyY2xlLXJpZ2h0XCI6IFwiZjEzOFwiLFxuXHRcdFx0XCJjaGV2cm9uLWNpcmNsZS11cFwiOiBcImYxMzlcIixcblx0XHRcdFwiY2hldnJvbi1jaXJjbGUtZG93blwiOiBcImYxM2FcIixcblx0XHRcdGh0bWw1OiBcImYxM2JcIixcblx0XHRcdGNzczM6IFwiZjEzY1wiLFxuXHRcdFx0YW5jaG9yOiBcImYxM2RcIixcblx0XHRcdFwidW5sb2NrLWFsdFwiOiBcImYxM2VcIixcblx0XHRcdGJ1bGxzZXllOiBcImYxNDBcIixcblx0XHRcdFwiZWxsaXBzaXMtaFwiOiBcImYxNDFcIixcblx0XHRcdFwiZWxsaXBzaXMtdlwiOiBcImYxNDJcIixcblx0XHRcdFwicnNzLXNxdWFyZVwiOiBcImYxNDNcIixcblx0XHRcdFwicGxheS1jaXJjbGVcIjogXCJmMTQ0XCIsXG5cdFx0XHR0aWNrZXQ6IFwiZjE0NVwiLFxuXHRcdFx0XCJtaW51cy1zcXVhcmVcIjogXCJmMTQ2XCIsXG5cdFx0XHRcIm1pbnVzLXNxdWFyZS1vXCI6IFwiZjE0N1wiLFxuXHRcdFx0XCJsZXZlbC11cFwiOiBcImYxNDhcIixcblx0XHRcdFwibGV2ZWwtZG93blwiOiBcImYxNDlcIixcblx0XHRcdFwiY2hlY2stc3F1YXJlXCI6IFwiZjE0YVwiLFxuXHRcdFx0XCJwZW5jaWwtc3F1YXJlXCI6IFwiZjE0YlwiLFxuXHRcdFx0XCJleHRlcm5hbC1saW5rLXNxdWFyZVwiOiBcImYxNGNcIixcblx0XHRcdFwic2hhcmUtc3F1YXJlXCI6IFwiZjE0ZFwiLFxuXHRcdFx0Y29tcGFzczogXCJmMTRlXCIsXG5cdFx0XHRcInRvZ2dsZS1kb3duLGNhcmV0LXNxdWFyZS1vLWRvd25cIjogXCJmMTUwXCIsXG5cdFx0XHRcInRvZ2dsZS11cCxjYXJldC1zcXVhcmUtby11cFwiOiBcImYxNTFcIixcblx0XHRcdFwidG9nZ2xlLXJpZ2h0LGNhcmV0LXNxdWFyZS1vLXJpZ2h0XCI6IFwiZjE1MlwiLFxuXHRcdFx0XCJldXJvLGV1clwiOiBcImYxNTNcIixcblx0XHRcdGdicDogXCJmMTU0XCIsXG5cdFx0XHRcImRvbGxhcix1c2RcIjogXCJmMTU1XCIsXG5cdFx0XHRcInJ1cGVlLGluclwiOiBcImYxNTZcIixcblx0XHRcdFwiY255LHJtYix5ZW4sanB5XCI6IFwiZjE1N1wiLFxuXHRcdFx0XCJydWJsZSxyb3VibGUscnViXCI6IFwiZjE1OFwiLFxuXHRcdFx0XCJ3b24sa3J3XCI6IFwiZjE1OVwiLFxuXHRcdFx0XCJiaXRjb2luLGJ0Y1wiOiBcImYxNWFcIixcblx0XHRcdGZpbGU6IFwiZjE1YlwiLFxuXHRcdFx0XCJmaWxlLXRleHRcIjogXCJmMTVjXCIsXG5cdFx0XHRcInNvcnQtYWxwaGEtYXNjXCI6IFwiZjE1ZFwiLFxuXHRcdFx0XCJzb3J0LWFscGhhLWRlc2NcIjogXCJmMTVlXCIsXG5cdFx0XHRcInNvcnQtYW1vdW50LWFzY1wiOiBcImYxNjBcIixcblx0XHRcdFwic29ydC1hbW91bnQtZGVzY1wiOiBcImYxNjFcIixcblx0XHRcdFwic29ydC1udW1lcmljLWFzY1wiOiBcImYxNjJcIixcblx0XHRcdFwic29ydC1udW1lcmljLWRlc2NcIjogXCJmMTYzXCIsXG5cdFx0XHRcInRodW1icy11cFwiOiBcImYxNjRcIixcblx0XHRcdFwidGh1bWJzLWRvd25cIjogXCJmMTY1XCIsXG5cdFx0XHRcInlvdXR1YmUtc3F1YXJlXCI6IFwiZjE2NlwiLFxuXHRcdFx0eW91dHViZTogXCJmMTY3XCIsXG5cdFx0XHR4aW5nOiBcImYxNjhcIixcblx0XHRcdFwieGluZy1zcXVhcmVcIjogXCJmMTY5XCIsXG5cdFx0XHRcInlvdXR1YmUtcGxheVwiOiBcImYxNmFcIixcblx0XHRcdGRyb3Bib3g6IFwiZjE2YlwiLFxuXHRcdFx0XCJzdGFjay1vdmVyZmxvd1wiOiBcImYxNmNcIixcblx0XHRcdGluc3RhZ3JhbTogXCJmMTZkXCIsXG5cdFx0XHRmbGlja3I6IFwiZjE2ZVwiLFxuXHRcdFx0YWRuOiBcImYxNzBcIixcblx0XHRcdGJpdGJ1Y2tldDogXCJmMTcxXCIsXG5cdFx0XHRcImJpdGJ1Y2tldC1zcXVhcmVcIjogXCJmMTcyXCIsXG5cdFx0XHR0dW1ibHI6IFwiZjE3M1wiLFxuXHRcdFx0XCJ0dW1ibHItc3F1YXJlXCI6IFwiZjE3NFwiLFxuXHRcdFx0XCJsb25nLWFycm93LWRvd25cIjogXCJmMTc1XCIsXG5cdFx0XHRcImxvbmctYXJyb3ctdXBcIjogXCJmMTc2XCIsXG5cdFx0XHRcImxvbmctYXJyb3ctbGVmdFwiOiBcImYxNzdcIixcblx0XHRcdFwibG9uZy1hcnJvdy1yaWdodFwiOiBcImYxNzhcIixcblx0XHRcdGFwcGxlOiBcImYxNzlcIixcblx0XHRcdHdpbmRvd3M6IFwiZjE3YVwiLFxuXHRcdFx0YW5kcm9pZDogXCJmMTdiXCIsXG5cdFx0XHRsaW51eDogXCJmMTdjXCIsXG5cdFx0XHRkcmliYmJsZTogXCJmMTdkXCIsXG5cdFx0XHRza3lwZTogXCJmMTdlXCIsXG5cdFx0XHRmb3Vyc3F1YXJlOiBcImYxODBcIixcblx0XHRcdHRyZWxsbzogXCJmMTgxXCIsXG5cdFx0XHRmZW1hbGU6IFwiZjE4MlwiLFxuXHRcdFx0bWFsZTogXCJmMTgzXCIsXG5cdFx0XHRcImdpdHRpcCxncmF0aXBheVwiOiBcImYxODRcIixcblx0XHRcdFwic3VuLW9cIjogXCJmMTg1XCIsXG5cdFx0XHRcIm1vb24tb1wiOiBcImYxODZcIixcblx0XHRcdGFyY2hpdmU6IFwiZjE4N1wiLFxuXHRcdFx0YnVnOiBcImYxODhcIixcblx0XHRcdHZrOiBcImYxODlcIixcblx0XHRcdHdlaWJvOiBcImYxOGFcIixcblx0XHRcdHJlbnJlbjogXCJmMThiXCIsXG5cdFx0XHRwYWdlbGluZXM6IFwiZjE4Y1wiLFxuXHRcdFx0XCJzdGFjay1leGNoYW5nZVwiOiBcImYxOGRcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLW8tcmlnaHRcIjogXCJmMThlXCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1vLWxlZnRcIjogXCJmMTkwXCIsXG5cdFx0XHRcInRvZ2dsZS1sZWZ0LGNhcmV0LXNxdWFyZS1vLWxlZnRcIjogXCJmMTkxXCIsXG5cdFx0XHRcImRvdC1jaXJjbGUtb1wiOiBcImYxOTJcIixcblx0XHRcdHdoZWVsY2hhaXI6IFwiZjE5M1wiLFxuXHRcdFx0XCJ2aW1lby1zcXVhcmVcIjogXCJmMTk0XCIsXG5cdFx0XHRcInR1cmtpc2gtbGlyYSx0cnlcIjogXCJmMTk1XCIsXG5cdFx0XHRcInBsdXMtc3F1YXJlLW9cIjogXCJmMTk2XCIsXG5cdFx0XHRcInNwYWNlLXNodXR0bGVcIjogXCJmMTk3XCIsXG5cdFx0XHRzbGFjazogXCJmMTk4XCIsXG5cdFx0XHRcImVudmVsb3BlLXNxdWFyZVwiOiBcImYxOTlcIixcblx0XHRcdHdvcmRwcmVzczogXCJmMTlhXCIsXG5cdFx0XHRvcGVuaWQ6IFwiZjE5YlwiLFxuXHRcdFx0XCJpbnN0aXR1dGlvbixiYW5rLHVuaXZlcnNpdHlcIjogXCJmMTljXCIsXG5cdFx0XHRcIm1vcnRhci1ib2FyZCxncmFkdWF0aW9uLWNhcFwiOiBcImYxOWRcIixcblx0XHRcdHlhaG9vOiBcImYxOWVcIixcblx0XHRcdGdvb2dsZTogXCJmMWEwXCIsXG5cdFx0XHRyZWRkaXQ6IFwiZjFhMVwiLFxuXHRcdFx0XCJyZWRkaXQtc3F1YXJlXCI6IFwiZjFhMlwiLFxuXHRcdFx0XCJzdHVtYmxldXBvbi1jaXJjbGVcIjogXCJmMWEzXCIsXG5cdFx0XHRzdHVtYmxldXBvbjogXCJmMWE0XCIsXG5cdFx0XHRkZWxpY2lvdXM6IFwiZjFhNVwiLFxuXHRcdFx0ZGlnZzogXCJmMWE2XCIsXG5cdFx0XHRcInBpZWQtcGlwZXItcHBcIjogXCJmMWE3XCIsXG5cdFx0XHRcInBpZWQtcGlwZXItYWx0XCI6IFwiZjFhOFwiLFxuXHRcdFx0ZHJ1cGFsOiBcImYxYTlcIixcblx0XHRcdGpvb21sYTogXCJmMWFhXCIsXG5cdFx0XHRsYW5ndWFnZTogXCJmMWFiXCIsXG5cdFx0XHRmYXg6IFwiZjFhY1wiLFxuXHRcdFx0YnVpbGRpbmc6IFwiZjFhZFwiLFxuXHRcdFx0Y2hpbGQ6IFwiZjFhZVwiLFxuXHRcdFx0cGF3OiBcImYxYjBcIixcblx0XHRcdHNwb29uOiBcImYxYjFcIixcblx0XHRcdGN1YmU6IFwiZjFiMlwiLFxuXHRcdFx0Y3ViZXM6IFwiZjFiM1wiLFxuXHRcdFx0YmVoYW5jZTogXCJmMWI0XCIsXG5cdFx0XHRcImJlaGFuY2Utc3F1YXJlXCI6IFwiZjFiNVwiLFxuXHRcdFx0c3RlYW06IFwiZjFiNlwiLFxuXHRcdFx0XCJzdGVhbS1zcXVhcmVcIjogXCJmMWI3XCIsXG5cdFx0XHRyZWN5Y2xlOiBcImYxYjhcIixcblx0XHRcdFwiYXV0b21vYmlsZSxjYXJcIjogXCJmMWI5XCIsXG5cdFx0XHRcImNhYix0YXhpXCI6IFwiZjFiYVwiLFxuXHRcdFx0dHJlZTogXCJmMWJiXCIsXG5cdFx0XHRzcG90aWZ5OiBcImYxYmNcIixcblx0XHRcdGRldmlhbnRhcnQ6IFwiZjFiZFwiLFxuXHRcdFx0c291bmRjbG91ZDogXCJmMWJlXCIsXG5cdFx0XHRkYXRhYmFzZTogXCJmMWMwXCIsXG5cdFx0XHRcImZpbGUtcGRmLW9cIjogXCJmMWMxXCIsXG5cdFx0XHRcImZpbGUtd29yZC1vXCI6IFwiZjFjMlwiLFxuXHRcdFx0XCJmaWxlLWV4Y2VsLW9cIjogXCJmMWMzXCIsXG5cdFx0XHRcImZpbGUtcG93ZXJwb2ludC1vXCI6IFwiZjFjNFwiLFxuXHRcdFx0XCJmaWxlLXBob3RvLW8sZmlsZS1waWN0dXJlLW8sZmlsZS1pbWFnZS1vXCI6IFwiZjFjNVwiLFxuXHRcdFx0XCJmaWxlLXppcC1vLGZpbGUtYXJjaGl2ZS1vXCI6IFwiZjFjNlwiLFxuXHRcdFx0XCJmaWxlLXNvdW5kLW8sZmlsZS1hdWRpby1vXCI6IFwiZjFjN1wiLFxuXHRcdFx0XCJmaWxlLW1vdmllLW8sZmlsZS12aWRlby1vXCI6IFwiZjFjOFwiLFxuXHRcdFx0XCJmaWxlLWNvZGUtb1wiOiBcImYxYzlcIixcblx0XHRcdHZpbmU6IFwiZjFjYVwiLFxuXHRcdFx0Y29kZXBlbjogXCJmMWNiXCIsXG5cdFx0XHRqc2ZpZGRsZTogXCJmMWNjXCIsXG5cdFx0XHRcImxpZmUtYm91eSxsaWZlLWJ1b3ksbGlmZS1zYXZlcixzdXBwb3J0LGxpZmUtcmluZ1wiOiBcImYxY2RcIixcblx0XHRcdFwiY2lyY2xlLW8tbm90Y2hcIjogXCJmMWNlXCIsXG5cdFx0XHRcInJhLHJlc2lzdGFuY2UscmViZWxcIjogXCJmMWQwXCIsXG5cdFx0XHRcImdlLGVtcGlyZVwiOiBcImYxZDFcIixcblx0XHRcdFwiZ2l0LXNxdWFyZVwiOiBcImYxZDJcIixcblx0XHRcdGdpdDogXCJmMWQzXCIsXG5cdFx0XHRcInktY29tYmluYXRvci1zcXVhcmUseWMtc3F1YXJlLGhhY2tlci1uZXdzXCI6IFwiZjFkNFwiLFxuXHRcdFx0XCJ0ZW5jZW50LXdlaWJvXCI6IFwiZjFkNVwiLFxuXHRcdFx0cXE6IFwiZjFkNlwiLFxuXHRcdFx0XCJ3ZWNoYXQsd2VpeGluXCI6IFwiZjFkN1wiLFxuXHRcdFx0XCJzZW5kLHBhcGVyLXBsYW5lXCI6IFwiZjFkOFwiLFxuXHRcdFx0XCJzZW5kLW8scGFwZXItcGxhbmUtb1wiOiBcImYxZDlcIixcblx0XHRcdGhpc3Rvcnk6IFwiZjFkYVwiLFxuXHRcdFx0XCJjaXJjbGUtdGhpblwiOiBcImYxZGJcIixcblx0XHRcdGhlYWRlcjogXCJmMWRjXCIsXG5cdFx0XHRwYXJhZ3JhcGg6IFwiZjFkZFwiLFxuXHRcdFx0c2xpZGVyczogXCJmMWRlXCIsXG5cdFx0XHRcInNoYXJlLWFsdFwiOiBcImYxZTBcIixcblx0XHRcdFwic2hhcmUtYWx0LXNxdWFyZVwiOiBcImYxZTFcIixcblx0XHRcdGJvbWI6IFwiZjFlMlwiLFxuXHRcdFx0XCJzb2NjZXItYmFsbC1vLGZ1dGJvbC1vXCI6IFwiZjFlM1wiLFxuXHRcdFx0dHR5OiBcImYxZTRcIixcblx0XHRcdGJpbm9jdWxhcnM6IFwiZjFlNVwiLFxuXHRcdFx0cGx1ZzogXCJmMWU2XCIsXG5cdFx0XHRzbGlkZXNoYXJlOiBcImYxZTdcIixcblx0XHRcdHR3aXRjaDogXCJmMWU4XCIsXG5cdFx0XHR5ZWxwOiBcImYxZTlcIixcblx0XHRcdFwibmV3c3BhcGVyLW9cIjogXCJmMWVhXCIsXG5cdFx0XHR3aWZpOiBcImYxZWJcIixcblx0XHRcdGNhbGN1bGF0b3I6IFwiZjFlY1wiLFxuXHRcdFx0cGF5cGFsOiBcImYxZWRcIixcblx0XHRcdFwiZ29vZ2xlLXdhbGxldFwiOiBcImYxZWVcIixcblx0XHRcdFwiY2MtdmlzYVwiOiBcImYxZjBcIixcblx0XHRcdFwiY2MtbWFzdGVyY2FyZFwiOiBcImYxZjFcIixcblx0XHRcdFwiY2MtZGlzY292ZXJcIjogXCJmMWYyXCIsXG5cdFx0XHRcImNjLWFtZXhcIjogXCJmMWYzXCIsXG5cdFx0XHRcImNjLXBheXBhbFwiOiBcImYxZjRcIixcblx0XHRcdFwiY2Mtc3RyaXBlXCI6IFwiZjFmNVwiLFxuXHRcdFx0XCJiZWxsLXNsYXNoXCI6IFwiZjFmNlwiLFxuXHRcdFx0XCJiZWxsLXNsYXNoLW9cIjogXCJmMWY3XCIsXG5cdFx0XHR0cmFzaDogXCJmMWY4XCIsXG5cdFx0XHRjb3B5cmlnaHQ6IFwiZjFmOVwiLFxuXHRcdFx0YXQ6IFwiZjFmYVwiLFxuXHRcdFx0ZXllZHJvcHBlcjogXCJmMWZiXCIsXG5cdFx0XHRcInBhaW50LWJydXNoXCI6IFwiZjFmY1wiLFxuXHRcdFx0XCJiaXJ0aGRheS1jYWtlXCI6IFwiZjFmZFwiLFxuXHRcdFx0XCJhcmVhLWNoYXJ0XCI6IFwiZjFmZVwiLFxuXHRcdFx0XCJwaWUtY2hhcnRcIjogXCJmMjAwXCIsXG5cdFx0XHRcImxpbmUtY2hhcnRcIjogXCJmMjAxXCIsXG5cdFx0XHRsYXN0Zm06IFwiZjIwMlwiLFxuXHRcdFx0XCJsYXN0Zm0tc3F1YXJlXCI6IFwiZjIwM1wiLFxuXHRcdFx0XCJ0b2dnbGUtb2ZmXCI6IFwiZjIwNFwiLFxuXHRcdFx0XCJ0b2dnbGUtb25cIjogXCJmMjA1XCIsXG5cdFx0XHRiaWN5Y2xlOiBcImYyMDZcIixcblx0XHRcdGJ1czogXCJmMjA3XCIsXG5cdFx0XHRpb3hob3N0OiBcImYyMDhcIixcblx0XHRcdGFuZ2VsbGlzdDogXCJmMjA5XCIsXG5cdFx0XHRjYzogXCJmMjBhXCIsXG5cdFx0XHRcInNoZWtlbCxzaGVxZWwsaWxzXCI6IFwiZjIwYlwiLFxuXHRcdFx0bWVhbnBhdGg6IFwiZjIwY1wiLFxuXHRcdFx0YnV5c2VsbGFkczogXCJmMjBkXCIsXG5cdFx0XHRjb25uZWN0ZGV2ZWxvcDogXCJmMjBlXCIsXG5cdFx0XHRkYXNoY3ViZTogXCJmMjEwXCIsXG5cdFx0XHRmb3J1bWJlZTogXCJmMjExXCIsXG5cdFx0XHRsZWFucHViOiBcImYyMTJcIixcblx0XHRcdHNlbGxzeTogXCJmMjEzXCIsXG5cdFx0XHRzaGlydHNpbmJ1bGs6IFwiZjIxNFwiLFxuXHRcdFx0c2ltcGx5YnVpbHQ6IFwiZjIxNVwiLFxuXHRcdFx0c2t5YXRsYXM6IFwiZjIxNlwiLFxuXHRcdFx0XCJjYXJ0LXBsdXNcIjogXCJmMjE3XCIsXG5cdFx0XHRcImNhcnQtYXJyb3ctZG93blwiOiBcImYyMThcIixcblx0XHRcdGRpYW1vbmQ6IFwiZjIxOVwiLFxuXHRcdFx0c2hpcDogXCJmMjFhXCIsXG5cdFx0XHRcInVzZXItc2VjcmV0XCI6IFwiZjIxYlwiLFxuXHRcdFx0bW90b3JjeWNsZTogXCJmMjFjXCIsXG5cdFx0XHRcInN0cmVldC12aWV3XCI6IFwiZjIxZFwiLFxuXHRcdFx0aGVhcnRiZWF0OiBcImYyMWVcIixcblx0XHRcdHZlbnVzOiBcImYyMjFcIixcblx0XHRcdG1hcnM6IFwiZjIyMlwiLFxuXHRcdFx0bWVyY3VyeTogXCJmMjIzXCIsXG5cdFx0XHRcImludGVyc2V4LHRyYW5zZ2VuZGVyXCI6IFwiZjIyNFwiLFxuXHRcdFx0XCJ0cmFuc2dlbmRlci1hbHRcIjogXCJmMjI1XCIsXG5cdFx0XHRcInZlbnVzLWRvdWJsZVwiOiBcImYyMjZcIixcblx0XHRcdFwibWFycy1kb3VibGVcIjogXCJmMjI3XCIsXG5cdFx0XHRcInZlbnVzLW1hcnNcIjogXCJmMjI4XCIsXG5cdFx0XHRcIm1hcnMtc3Ryb2tlXCI6IFwiZjIyOVwiLFxuXHRcdFx0XCJtYXJzLXN0cm9rZS12XCI6IFwiZjIyYVwiLFxuXHRcdFx0XCJtYXJzLXN0cm9rZS1oXCI6IFwiZjIyYlwiLFxuXHRcdFx0bmV1dGVyOiBcImYyMmNcIixcblx0XHRcdGdlbmRlcmxlc3M6IFwiZjIyZFwiLFxuXHRcdFx0XCJmYWNlYm9vay1vZmZpY2lhbFwiOiBcImYyMzBcIixcblx0XHRcdFwicGludGVyZXN0LXBcIjogXCJmMjMxXCIsXG5cdFx0XHR3aGF0c2FwcDogXCJmMjMyXCIsXG5cdFx0XHRzZXJ2ZXI6IFwiZjIzM1wiLFxuXHRcdFx0XCJ1c2VyLXBsdXNcIjogXCJmMjM0XCIsXG5cdFx0XHRcInVzZXItdGltZXNcIjogXCJmMjM1XCIsXG5cdFx0XHRcImhvdGVsLGJlZFwiOiBcImYyMzZcIixcblx0XHRcdHZpYWNvaW46IFwiZjIzN1wiLFxuXHRcdFx0dHJhaW46IFwiZjIzOFwiLFxuXHRcdFx0c3Vid2F5OiBcImYyMzlcIixcblx0XHRcdG1lZGl1bTogXCJmMjNhXCIsXG5cdFx0XHRcInljLHktY29tYmluYXRvclwiOiBcImYyM2JcIixcblx0XHRcdFwib3B0aW4tbW9uc3RlclwiOiBcImYyM2NcIixcblx0XHRcdG9wZW5jYXJ0OiBcImYyM2RcIixcblx0XHRcdGV4cGVkaXRlZHNzbDogXCJmMjNlXCIsXG5cdFx0XHRcImJhdHRlcnktNCxiYXR0ZXJ5LWZ1bGxcIjogXCJmMjQwXCIsXG5cdFx0XHRcImJhdHRlcnktMyxiYXR0ZXJ5LXRocmVlLXF1YXJ0ZXJzXCI6IFwiZjI0MVwiLFxuXHRcdFx0XCJiYXR0ZXJ5LTIsYmF0dGVyeS1oYWxmXCI6IFwiZjI0MlwiLFxuXHRcdFx0XCJiYXR0ZXJ5LTEsYmF0dGVyeS1xdWFydGVyXCI6IFwiZjI0M1wiLFxuXHRcdFx0XCJiYXR0ZXJ5LTAsYmF0dGVyeS1lbXB0eVwiOiBcImYyNDRcIixcblx0XHRcdFwibW91c2UtcG9pbnRlclwiOiBcImYyNDVcIixcblx0XHRcdFwiaS1jdXJzb3JcIjogXCJmMjQ2XCIsXG5cdFx0XHRcIm9iamVjdC1ncm91cFwiOiBcImYyNDdcIixcblx0XHRcdFwib2JqZWN0LXVuZ3JvdXBcIjogXCJmMjQ4XCIsXG5cdFx0XHRcInN0aWNreS1ub3RlXCI6IFwiZjI0OVwiLFxuXHRcdFx0XCJzdGlja3ktbm90ZS1vXCI6IFwiZjI0YVwiLFxuXHRcdFx0XCJjYy1qY2JcIjogXCJmMjRiXCIsXG5cdFx0XHRcImNjLWRpbmVycy1jbHViXCI6IFwiZjI0Y1wiLFxuXHRcdFx0Y2xvbmU6IFwiZjI0ZFwiLFxuXHRcdFx0XCJiYWxhbmNlLXNjYWxlXCI6IFwiZjI0ZVwiLFxuXHRcdFx0XCJob3VyZ2xhc3Mtb1wiOiBcImYyNTBcIixcblx0XHRcdFwiaG91cmdsYXNzLTEsaG91cmdsYXNzLXN0YXJ0XCI6IFwiZjI1MVwiLFxuXHRcdFx0XCJob3VyZ2xhc3MtMixob3VyZ2xhc3MtaGFsZlwiOiBcImYyNTJcIixcblx0XHRcdFwiaG91cmdsYXNzLTMsaG91cmdsYXNzLWVuZFwiOiBcImYyNTNcIixcblx0XHRcdGhvdXJnbGFzczogXCJmMjU0XCIsXG5cdFx0XHRcImhhbmQtZ3JhYi1vLGhhbmQtcm9jay1vXCI6IFwiZjI1NVwiLFxuXHRcdFx0XCJoYW5kLXN0b3AtbyxoYW5kLXBhcGVyLW9cIjogXCJmMjU2XCIsXG5cdFx0XHRcImhhbmQtc2Npc3NvcnMtb1wiOiBcImYyNTdcIixcblx0XHRcdFwiaGFuZC1saXphcmQtb1wiOiBcImYyNThcIixcblx0XHRcdFwiaGFuZC1zcG9jay1vXCI6IFwiZjI1OVwiLFxuXHRcdFx0XCJoYW5kLXBvaW50ZXItb1wiOiBcImYyNWFcIixcblx0XHRcdFwiaGFuZC1wZWFjZS1vXCI6IFwiZjI1YlwiLFxuXHRcdFx0dHJhZGVtYXJrOiBcImYyNWNcIixcblx0XHRcdHJlZ2lzdGVyZWQ6IFwiZjI1ZFwiLFxuXHRcdFx0XCJjcmVhdGl2ZS1jb21tb25zXCI6IFwiZjI1ZVwiLFxuXHRcdFx0Z2c6IFwiZjI2MFwiLFxuXHRcdFx0XCJnZy1jaXJjbGVcIjogXCJmMjYxXCIsXG5cdFx0XHR0cmlwYWR2aXNvcjogXCJmMjYyXCIsXG5cdFx0XHRvZG5va2xhc3NuaWtpOiBcImYyNjNcIixcblx0XHRcdFwib2Rub2tsYXNzbmlraS1zcXVhcmVcIjogXCJmMjY0XCIsXG5cdFx0XHRcImdldC1wb2NrZXRcIjogXCJmMjY1XCIsXG5cdFx0XHRcIndpa2lwZWRpYS13XCI6IFwiZjI2NlwiLFxuXHRcdFx0c2FmYXJpOiBcImYyNjdcIixcblx0XHRcdGNocm9tZTogXCJmMjY4XCIsXG5cdFx0XHRmaXJlZm94OiBcImYyNjlcIixcblx0XHRcdG9wZXJhOiBcImYyNmFcIixcblx0XHRcdFwiaW50ZXJuZXQtZXhwbG9yZXJcIjogXCJmMjZiXCIsXG5cdFx0XHRcInR2LHRlbGV2aXNpb25cIjogXCJmMjZjXCIsXG5cdFx0XHRjb250YW86IFwiZjI2ZFwiLFxuXHRcdFx0XCI1MDBweFwiOiBcImYyNmVcIixcblx0XHRcdGFtYXpvbjogXCJmMjcwXCIsXG5cdFx0XHRcImNhbGVuZGFyLXBsdXMtb1wiOiBcImYyNzFcIixcblx0XHRcdFwiY2FsZW5kYXItbWludXMtb1wiOiBcImYyNzJcIixcblx0XHRcdFwiY2FsZW5kYXItdGltZXMtb1wiOiBcImYyNzNcIixcblx0XHRcdFwiY2FsZW5kYXItY2hlY2stb1wiOiBcImYyNzRcIixcblx0XHRcdGluZHVzdHJ5OiBcImYyNzVcIixcblx0XHRcdFwibWFwLXBpblwiOiBcImYyNzZcIixcblx0XHRcdFwibWFwLXNpZ25zXCI6IFwiZjI3N1wiLFxuXHRcdFx0XCJtYXAtb1wiOiBcImYyNzhcIixcblx0XHRcdG1hcDogXCJmMjc5XCIsXG5cdFx0XHRjb21tZW50aW5nOiBcImYyN2FcIixcblx0XHRcdFwiY29tbWVudGluZy1vXCI6IFwiZjI3YlwiLFxuXHRcdFx0aG91eno6IFwiZjI3Y1wiLFxuXHRcdFx0dmltZW86IFwiZjI3ZFwiLFxuXHRcdFx0XCJibGFjay10aWVcIjogXCJmMjdlXCIsXG5cdFx0XHRmb250aWNvbnM6IFwiZjI4MFwiLFxuXHRcdFx0XCJyZWRkaXQtYWxpZW5cIjogXCJmMjgxXCIsXG5cdFx0XHRlZGdlOiBcImYyODJcIixcblx0XHRcdFwiY3JlZGl0LWNhcmQtYWx0XCI6IFwiZjI4M1wiLFxuXHRcdFx0Y29kaWVwaWU6IFwiZjI4NFwiLFxuXHRcdFx0bW9keDogXCJmMjg1XCIsXG5cdFx0XHRcImZvcnQtYXdlc29tZVwiOiBcImYyODZcIixcblx0XHRcdHVzYjogXCJmMjg3XCIsXG5cdFx0XHRcInByb2R1Y3QtaHVudFwiOiBcImYyODhcIixcblx0XHRcdG1peGNsb3VkOiBcImYyODlcIixcblx0XHRcdHNjcmliZDogXCJmMjhhXCIsXG5cdFx0XHRcInBhdXNlLWNpcmNsZVwiOiBcImYyOGJcIixcblx0XHRcdFwicGF1c2UtY2lyY2xlLW9cIjogXCJmMjhjXCIsXG5cdFx0XHRcInN0b3AtY2lyY2xlXCI6IFwiZjI4ZFwiLFxuXHRcdFx0XCJzdG9wLWNpcmNsZS1vXCI6IFwiZjI4ZVwiLFxuXHRcdFx0XCJzaG9wcGluZy1iYWdcIjogXCJmMjkwXCIsXG5cdFx0XHRcInNob3BwaW5nLWJhc2tldFwiOiBcImYyOTFcIixcblx0XHRcdGhhc2h0YWc6IFwiZjI5MlwiLFxuXHRcdFx0Ymx1ZXRvb3RoOiBcImYyOTNcIixcblx0XHRcdFwiYmx1ZXRvb3RoLWJcIjogXCJmMjk0XCIsXG5cdFx0XHRwZXJjZW50OiBcImYyOTVcIixcblx0XHRcdGdpdGxhYjogXCJmMjk2XCIsXG5cdFx0XHR3cGJlZ2lubmVyOiBcImYyOTdcIixcblx0XHRcdHdwZm9ybXM6IFwiZjI5OFwiLFxuXHRcdFx0ZW52aXJhOiBcImYyOTlcIixcblx0XHRcdFwidW5pdmVyc2FsLWFjY2Vzc1wiOiBcImYyOWFcIixcblx0XHRcdFwid2hlZWxjaGFpci1hbHRcIjogXCJmMjliXCIsXG5cdFx0XHRcInF1ZXN0aW9uLWNpcmNsZS1vXCI6IFwiZjI5Y1wiLFxuXHRcdFx0YmxpbmQ6IFwiZjI5ZFwiLFxuXHRcdFx0XCJhdWRpby1kZXNjcmlwdGlvblwiOiBcImYyOWVcIixcblx0XHRcdFwidm9sdW1lLWNvbnRyb2wtcGhvbmVcIjogXCJmMmEwXCIsXG5cdFx0XHRicmFpbGxlOiBcImYyYTFcIixcblx0XHRcdFwiYXNzaXN0aXZlLWxpc3RlbmluZy1zeXN0ZW1zXCI6IFwiZjJhMlwiLFxuXHRcdFx0XCJhc2wtaW50ZXJwcmV0aW5nLGFtZXJpY2FuLXNpZ24tbGFuZ3VhZ2UtaW50ZXJwcmV0aW5nXCI6IFwiZjJhM1wiLFxuXHRcdFx0XCJkZWFmbmVzcyxoYXJkLW9mLWhlYXJpbmcsZGVhZlwiOiBcImYyYTRcIixcblx0XHRcdGdsaWRlOiBcImYyYTVcIixcblx0XHRcdFwiZ2xpZGUtZ1wiOiBcImYyYTZcIixcblx0XHRcdFwic2lnbmluZyxzaWduLWxhbmd1YWdlXCI6IFwiZjJhN1wiLFxuXHRcdFx0XCJsb3ctdmlzaW9uXCI6IFwiZjJhOFwiLFxuXHRcdFx0dmlhZGVvOiBcImYyYTlcIixcblx0XHRcdFwidmlhZGVvLXNxdWFyZVwiOiBcImYyYWFcIixcblx0XHRcdHNuYXBjaGF0OiBcImYyYWJcIixcblx0XHRcdFwic25hcGNoYXQtZ2hvc3RcIjogXCJmMmFjXCIsXG5cdFx0XHRcInNuYXBjaGF0LXNxdWFyZVwiOiBcImYyYWRcIixcblx0XHRcdFwicGllZC1waXBlclwiOiBcImYyYWVcIixcblx0XHRcdFwiZmlyc3Qtb3JkZXJcIjogXCJmMmIwXCIsXG5cdFx0XHR5b2FzdDogXCJmMmIxXCIsXG5cdFx0XHR0aGVtZWlzbGU6IFwiZjJiMlwiLFxuXHRcdFx0XCJnb29nbGUtcGx1cy1jaXJjbGUsZ29vZ2xlLXBsdXMtb2ZmaWNpYWxcIjogXCJmMmIzXCIsXG5cdFx0XHRcImZhLGZvbnQtYXdlc29tZVwiOiBcImYyYjRcIlxuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBpY29uKGQpIHtcblx0XHR2YXIgY29kZTtcblxuXHRcdGlmIChvcHRpb25zLmljb25NYXAgJiYgb3B0aW9ucy5zaG93SWNvbnMgJiYgb3B0aW9ucy5pY29ucykge1xuXHRcdFx0aWYgKG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dICYmIG9wdGlvbnMuaWNvbk1hcFtvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXV0pIHtcblx0XHRcdFx0Y29kZSA9IG9wdGlvbnMuaWNvbk1hcFtvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXV07XG5cdFx0XHR9IGVsc2UgaWYgKG9wdGlvbnMuaWNvbk1hcFtkLmxhYmVsc1swXV0pIHtcblx0XHRcdFx0Y29kZSA9IG9wdGlvbnMuaWNvbk1hcFtkLmxhYmVsc1swXV07XG5cdFx0XHR9IGVsc2UgaWYgKG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dKSB7XG5cdFx0XHRcdGNvZGUgPSBvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY29kZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGltYWdlKGQpIHtcblx0XHR2YXIgaSwgaW1hZ2VzRm9yTGFiZWwsIGltZywgaW1nTGV2ZWwsIGxhYmVsLCBsYWJlbFByb3BlcnR5VmFsdWUsIHByb3BlcnR5LCB2YWx1ZTtcblxuXHRcdGlmIChvcHRpb25zLmltYWdlcykge1xuXHRcdFx0aW1hZ2VzRm9yTGFiZWwgPSBvcHRpb25zLmltYWdlTWFwW2QubGFiZWxzWzBdXTtcblxuXHRcdFx0aWYgKGltYWdlc0ZvckxhYmVsKSB7XG5cdFx0XHRcdGltZ0xldmVsID0gMDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgaW1hZ2VzRm9yTGFiZWwubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRsYWJlbFByb3BlcnR5VmFsdWUgPSBpbWFnZXNGb3JMYWJlbFtpXS5zcGxpdChcInxcIik7XG5cblx0XHRcdFx0XHRzd2l0Y2ggKGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGNhc2UgMzpcblx0XHRcdFx0XHRcdFx0dmFsdWUgPSBsYWJlbFByb3BlcnR5VmFsdWVbMl07XG5cdFx0XHRcdFx0XHQvKiBmYWxscyB0aHJvdWdoICovXG5cdFx0XHRcdFx0XHRjYXNlIDI6XG5cdFx0XHRcdFx0XHRcdHByb3BlcnR5ID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzFdO1xuXHRcdFx0XHRcdFx0LyogZmFsbHMgdGhyb3VnaCAqL1xuXHRcdFx0XHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRcdFx0XHRsYWJlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZVswXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRkLmxhYmVsc1swXSA9PT0gbGFiZWwgJiZcblx0XHRcdFx0XHRcdCghcHJvcGVydHkgfHwgZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSAmJlxuXHRcdFx0XHRcdFx0KCF2YWx1ZSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldID09PSB2YWx1ZSlcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdGlmIChsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoID4gaW1nTGV2ZWwpIHtcblx0XHRcdFx0XHRcdFx0aW1nID0gb3B0aW9ucy5pbWFnZXNbaW1hZ2VzRm9yTGFiZWxbaV1dO1xuXHRcdFx0XHRcdFx0XHRpbWdMZXZlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGg7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGltZztcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXQoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuXHRcdGluaXRJY29uTWFwKCk7XG5cblx0XHRtZXJnZShvcHRpb25zLCBfb3B0aW9ucyk7XG5cblx0XHRpZiAob3B0aW9ucy5pY29ucykge1xuXHRcdFx0b3B0aW9ucy5zaG93SWNvbnMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICghb3B0aW9ucy5taW5Db2xsaXNpb24pIHtcblx0XHRcdG9wdGlvbnMubWluQ29sbGlzaW9uID0gb3B0aW9ucy5ub2RlUmFkaXVzICogMjtcblx0XHR9XG5cblx0XHRpbml0SW1hZ2VNYXAoKTtcblxuXHRcdHNlbGVjdG9yID0gX3NlbGVjdG9yO1xuXG5cdFx0Y29udGFpbmVyID0gZDMuc2VsZWN0KHNlbGVjdG9yKTtcblxuXHRcdGNvbnRhaW5lci5hdHRyKFwiY2xhc3NcIiwgXCJuZW80amQzXCIpLmh0bWwoXCJcIik7XG5cblx0XHRpZiAob3B0aW9ucy5pbmZvUGFuZWwpIHtcblx0XHRcdGluZm8gPSBhcHBlbmRJbmZvUGFuZWwoY29udGFpbmVyKTtcblx0XHR9XG5cblx0XHRhcHBlbmRHcmFwaChjb250YWluZXIpO1xuXG5cdFx0c2ltdWxhdGlvbiA9IGluaXRTaW11bGF0aW9uKCk7XG5cblx0XHRpZiAob3B0aW9ucy5uZW80akRhdGEpIHtcblx0XHRcdGxvYWROZW80akRhdGEob3B0aW9ucy5uZW80akRhdGEpO1xuXHRcdH0gZWxzZSBpZiAob3B0aW9ucy5uZW80akRhdGFVcmwpIHtcblx0XHRcdGxvYWROZW80akRhdGFGcm9tVXJsKG9wdGlvbnMubmVvNGpEYXRhVXJsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIkVycm9yOiBib3RoIG5lbzRqRGF0YSBhbmQgbmVvNGpEYXRhVXJsIGFyZSBlbXB0eSFcIik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdEljb25NYXAoKSB7XG5cdFx0T2JqZWN0LmtleXMob3B0aW9ucy5pY29uTWFwKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XG5cdFx0XHR2YXIga2V5cyA9IGtleS5zcGxpdChcIixcIiksXG5cdFx0XHRcdHZhbHVlID0gb3B0aW9ucy5pY29uTWFwW2tleV07XG5cblx0XHRcdGtleXMuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRcdG9wdGlvbnMuaWNvbk1hcFtrZXldID0gdmFsdWU7XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXRJbWFnZU1hcCgpIHtcblx0XHR2YXIga2V5LCBrZXlzLCBzZWxlY3RvcjtcblxuXHRcdGZvciAoa2V5IGluIG9wdGlvbnMuaW1hZ2VzKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5pbWFnZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRrZXlzID0ga2V5LnNwbGl0KFwifFwiKTtcblxuXHRcdFx0XHRpZiAoIW9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0pIHtcblx0XHRcdFx0XHRvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dID0gW2tleV07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXS5wdXNoKGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpbml0U2ltdWxhdGlvbigpIHtcblx0XHR2YXIgc2ltdWxhdGlvbiA9IGQzXG5cdFx0XHQuZm9yY2VTaW11bGF0aW9uKClcblx0XHRcdC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgLnZlbG9jaXR5RGVjYXkoMC44KVxuXHRcdFx0Ly8gICAgICAgICAgICAgICAgICAgICAgICAgICAuZm9yY2UoJ3gnLCBkMy5mb3JjZSgpLnN0cmVuZ3RoKDAuMDAyKSlcblx0XHRcdC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZvcmNlKCd5JywgZDMuZm9yY2UoKS5zdHJlbmd0aCgwLjAwMikpXG5cdFx0XHQuZm9yY2UoXG5cdFx0XHRcdFwiY29sbGlkZVwiLFxuXHRcdFx0XHRkM1xuXHRcdFx0XHRcdC5mb3JjZUNvbGxpZGUoKVxuXHRcdFx0XHRcdC5yYWRpdXMoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBvcHRpb25zLm1pbkNvbGxpc2lvbjtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pdGVyYXRpb25zKDIpXG5cdFx0XHQpXG5cdFx0XHQuZm9yY2UoXCJjaGFyZ2VcIiwgZDMuZm9yY2VNYW55Qm9keSgpKVxuXHRcdFx0LmZvcmNlKFxuXHRcdFx0XHRcImxpbmtcIixcblx0XHRcdFx0ZDMuZm9yY2VMaW5rKCkuaWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5pZDtcblx0XHRcdFx0fSlcblx0XHRcdClcblx0XHRcdC5mb3JjZShcblx0XHRcdFx0XCJjZW50ZXJcIixcblx0XHRcdFx0ZDMuZm9yY2VDZW50ZXIoXG5cdFx0XHRcdFx0c3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuXHRcdFx0XHRcdHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdFx0Lm9uKFwidGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHRpY2soKTtcblx0XHRcdH0pXG5cdFx0XHQub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAob3B0aW9ucy56b29tRml0ICYmICFqdXN0TG9hZGVkKSB7XG5cdFx0XHRcdFx0anVzdExvYWRlZCA9IHRydWU7XG5cdFx0XHRcdFx0em9vbUZpdCgyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRyZXR1cm4gc2ltdWxhdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGEoKSB7XG5cdFx0bm9kZXMgPSBbXTtcblx0XHRyZWxhdGlvbnNoaXBzID0gW107XG5cblx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGFGcm9tVXJsKG5lbzRqRGF0YVVybCkge1xuXHRcdG5vZGVzID0gW107XG5cdFx0cmVsYXRpb25zaGlwcyA9IFtdO1xuXG5cdFx0ZDMuanNvbihuZW80akRhdGFVcmwsIGZ1bmN0aW9uIChlcnJvciwgZGF0YSkge1xuXHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdHRocm93IGVycm9yO1xuXHRcdFx0fVxuXG5cdFx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWVyZ2UodGFyZ2V0LCBzb3VyY2UpIHtcblx0XHRPYmplY3Qua2V5cyhzb3VyY2UpLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdFx0XHR0YXJnZXRbcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIG5lbzRqRGF0YVRvRDNEYXRhKGRhdGEpIHtcblx0XHR2YXIgZ3JhcGggPSB7XG5cdFx0XHRub2RlczogW10sXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBbXVxuXHRcdH07XG5cblx0XHRkYXRhLnJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRyZXN1bHQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdGRhdGEuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0XHRcdGlmICghY29udGFpbnMoZ3JhcGgubm9kZXMsIG5vZGUuaWQpKSB7XG5cdFx0XHRcdFx0XHRncmFwaC5ub2Rlcy5wdXNoKG5vZGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmZvckVhY2goZnVuY3Rpb24gKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC5zb3VyY2UgPSByZWxhdGlvbnNoaXAuc3RhcnROb2RlO1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC50YXJnZXQgPSByZWxhdGlvbnNoaXAuZW5kTm9kZTtcblx0XHRcdFx0XHRncmFwaC5yZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdFx0XHRpZiAoYS5zb3VyY2UgPiBiLnNvdXJjZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChhLnNvdXJjZSA8IGIuc291cmNlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChhLnRhcmdldCA+IGIudGFyZ2V0KSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoYS50YXJnZXQgPCBiLnRhcmdldCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0aSAhPT0gMCAmJlxuXHRcdFx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLnNvdXJjZSA9PT0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2kgLSAxXS5zb3VyY2UgJiZcblx0XHRcdFx0XHRcdGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS50YXJnZXQgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0udGFyZ2V0XG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0ubGlua251bSArIDE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5saW5rbnVtID0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGdyYXBoO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZG9tRDNEYXRhKGQsIG1heE5vZGVzVG9HZW5lcmF0ZSkge1xuXHRcdHZhciBkYXRhID0ge1xuXHRcdFx0XHRub2RlczogW10sXG5cdFx0XHRcdHJlbGF0aW9uc2hpcHM6IFtdXG5cdFx0XHR9LFxuXHRcdFx0aSxcblx0XHRcdGxhYmVsLFxuXHRcdFx0bm9kZSxcblx0XHRcdG51bU5vZGVzID0gKChtYXhOb2Rlc1RvR2VuZXJhdGUgKiBNYXRoLnJhbmRvbSgpKSA8PCAwKSArIDEsXG5cdFx0XHRyZWxhdGlvbnNoaXAsXG5cdFx0XHRzID0gc2l6ZSgpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcblx0XHRcdGxhYmVsID0gcmFuZG9tTGFiZWwoKTtcblxuXHRcdFx0bm9kZSA9IHtcblx0XHRcdFx0aWQ6IHMubm9kZXMgKyAxICsgaSxcblx0XHRcdFx0bGFiZWxzOiBbbGFiZWxdLFxuXHRcdFx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdFx0cmFuZG9tOiBsYWJlbFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR4OiBkLngsXG5cdFx0XHRcdHk6IGQueVxuXHRcdFx0fTtcblxuXHRcdFx0ZGF0YS5ub2Rlc1tkYXRhLm5vZGVzLmxlbmd0aF0gPSBub2RlO1xuXG5cdFx0XHRyZWxhdGlvbnNoaXAgPSB7XG5cdFx0XHRcdGlkOiBzLnJlbGF0aW9uc2hpcHMgKyAxICsgaSxcblx0XHRcdFx0dHlwZTogbGFiZWwudG9VcHBlckNhc2UoKSxcblx0XHRcdFx0c3RhcnROb2RlOiBkLmlkLFxuXHRcdFx0XHRlbmROb2RlOiBzLm5vZGVzICsgMSArIGksXG5cdFx0XHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdFx0XHRmcm9tOiBEYXRlLm5vdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNvdXJjZTogZC5pZCxcblx0XHRcdFx0dGFyZ2V0OiBzLm5vZGVzICsgMSArIGksXG5cdFx0XHRcdGxpbmtudW06IHMucmVsYXRpb25zaGlwcyArIDEgKyBpXG5cdFx0XHR9O1xuXG5cdFx0XHRkYXRhLnJlbGF0aW9uc2hpcHNbZGF0YS5yZWxhdGlvbnNoaXBzLmxlbmd0aF0gPSByZWxhdGlvbnNoaXA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cblxuXHRmdW5jdGlvbiByYW5kb21MYWJlbCgpIHtcblx0XHR2YXIgaWNvbnMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmljb25NYXApO1xuXHRcdHJldHVybiBpY29uc1soaWNvbnMubGVuZ3RoICogTWF0aC5yYW5kb20oKSkgPDwgMF07XG5cdH1cblxuXHRmdW5jdGlvbiByZXNldFdpdGhOZW80akRhdGEobmVvNGpEYXRhKSB7XG5cdFx0Ly8gQ2FsbCB0aGUgaW5pdCBtZXRob2QgYWdhaW4gd2l0aCBuZXcgZGF0YVxuXHRcdHZhciBuZXdPcHRpb25zID0gT2JqZWN0LmFzc2lnbihfb3B0aW9ucywge1xuXHRcdFx0bmVvNGpEYXRhOiBuZW80akRhdGEsXG5cdFx0XHRuZW80akRhdGFVcmw6IHVuZGVmaW5lZFxuXHRcdH0pO1xuXHRcdGluaXQoX3NlbGVjdG9yLCBuZXdPcHRpb25zKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJvdGF0ZShjeCwgY3ksIHgsIHksIGFuZ2xlKSB7XG5cdFx0dmFyIHJhZGlhbnMgPSAoTWF0aC5QSSAvIDE4MCkgKiBhbmdsZSxcblx0XHRcdGNvcyA9IE1hdGguY29zKHJhZGlhbnMpLFxuXHRcdFx0c2luID0gTWF0aC5zaW4ocmFkaWFucyksXG5cdFx0XHRueCA9IGNvcyAqICh4IC0gY3gpICsgc2luICogKHkgLSBjeSkgKyBjeCxcblx0XHRcdG55ID0gY29zICogKHkgLSBjeSkgLSBzaW4gKiAoeCAtIGN4KSArIGN5O1xuXG5cdFx0cmV0dXJuIHsgeDogbngsIHk6IG55IH07XG5cdH1cblxuXHRmdW5jdGlvbiByb3RhdGVQb2ludChjLCBwLCBhbmdsZSkge1xuXHRcdHJldHVybiByb3RhdGUoYy54LCBjLnksIHAueCwgcC55LCBhbmdsZSk7XG5cdH1cblxuXHRmdW5jdGlvbiByb3RhdGlvbihzb3VyY2UsIHRhcmdldCkge1xuXHRcdHJldHVybiAoTWF0aC5hdGFuMih0YXJnZXQueSAtIHNvdXJjZS55LCB0YXJnZXQueCAtIHNvdXJjZS54KSAqIDE4MCkgLyBNYXRoLlBJO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2l6ZSgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bm9kZXM6IG5vZGVzLmxlbmd0aCxcblx0XHRcdHJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMubGVuZ3RoXG5cdFx0fTtcblx0fVxuXHQvKlxuICAgIGZ1bmN0aW9uIHNtb290aFRyYW5zZm9ybShlbGVtLCB0cmFuc2xhdGUsIHNjYWxlKSB7XG4gICAgICAgIHZhciBhbmltYXRpb25NaWxsaXNlY29uZHMgPSA1MDAwLFxuICAgICAgICAgICAgdGltZW91dE1pbGxpc2Vjb25kcyA9IDUwLFxuICAgICAgICAgICAgc3RlcHMgPSBwYXJzZUludChhbmltYXRpb25NaWxsaXNlY29uZHMgLyB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc21vb3RoVHJhbnNmb3JtU3RlcChlbGVtLCB0cmFuc2xhdGUsIHNjYWxlLCB0aW1lb3V0TWlsbGlzZWNvbmRzLCAxLCBzdGVwcyk7XG4gICAgICAgIH0sIHRpbWVvdXRNaWxsaXNlY29uZHMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNtb290aFRyYW5zZm9ybVN0ZXAoZWxlbSwgdHJhbnNsYXRlLCBzY2FsZSwgdGltZW91dE1pbGxpc2Vjb25kcywgc3RlcCwgc3RlcHMpIHtcbiAgICAgICAgdmFyIHByb2dyZXNzID0gc3RlcCAvIHN0ZXBzO1xuXG4gICAgICAgIGVsZW0uYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgKHRyYW5zbGF0ZVswXSAqIHByb2dyZXNzKSArICcsICcgKyAodHJhbnNsYXRlWzFdICogcHJvZ3Jlc3MpICsgJykgc2NhbGUoJyArIChzY2FsZSAqIHByb2dyZXNzKSArICcpJyk7XG5cbiAgICAgICAgaWYgKHN0ZXAgPCBzdGVwcykge1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzbW9vdGhUcmFuc2Zvcm1TdGVwKGVsZW0sIHRyYW5zbGF0ZSwgc2NhbGUsIHRpbWVvdXRNaWxsaXNlY29uZHMsIHN0ZXAgKyAxLCBzdGVwcyk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0TWlsbGlzZWNvbmRzKTtcbiAgICAgICAgfVxuICAgIH1cbiovXG5cdGZ1bmN0aW9uIHN0aWNrTm9kZShkKSB7XG5cdFx0ZC5meCA9IGQzLmV2ZW50Lng7XG5cdFx0ZC5meSA9IGQzLmV2ZW50Lnk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrKCkge1xuXHRcdHRpY2tOb2RlcygpO1xuXHRcdHRpY2tSZWxhdGlvbnNoaXBzKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrTm9kZXMoKSB7XG5cdFx0aWYgKG5vZGUpIHtcblx0XHRcdG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIiwgXCIgKyBkLnkgKyBcIilcIjtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzKCkge1xuXHRcdGlmIChyZWxhdGlvbnNoaXApIHtcblx0XHRcdHJlbGF0aW9uc2hpcC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHZhciBhbmdsZSA9IHJvdGF0aW9uKGQuc291cmNlLCBkLnRhcmdldCk7XG5cdFx0XHRcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQuc291cmNlLnggKyBcIiwgXCIgKyBkLnNvdXJjZS55ICsgXCIpIHJvdGF0ZShcIiArIGFuZ2xlICsgXCIpXCI7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNUZXh0cygpO1xuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNPdXRsaW5lcygpO1xuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKSB7XG5cdFx0cmVsYXRpb25zaGlwLmVhY2goZnVuY3Rpb24gKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0dmFyIHJlbCA9IGQzLnNlbGVjdCh0aGlzKSxcblx0XHRcdFx0b3V0bGluZSA9IHJlbC5zZWxlY3QoXCIub3V0bGluZVwiKSxcblx0XHRcdFx0dGV4dCA9IHJlbC5zZWxlY3QoXCIudGV4dFwiKSxcblx0XHRcdFx0YmJveCA9IHRleHQubm9kZSgpLmdldEJCb3goKSxcblx0XHRcdFx0cGFkZGluZyA9IDM7XG5cblx0XHRcdG91dGxpbmUuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0dmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuXHRcdFx0XHRcdGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcblx0XHRcdFx0XHR0ZXh0Qm91bmRpbmdCb3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCksXG5cdFx0XHRcdFx0dGV4dFBhZGRpbmcgPSA1LFxuXHRcdFx0XHRcdHUgPSB1bml0YXJ5VmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0dGV4dE1hcmdpbiA9IHtcblx0XHRcdFx0XHRcdHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LngpICogMC41LFxuXHRcdFx0XHRcdFx0eTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKHRleHRCb3VuZGluZ0JveC53aWR0aCArIHRleHRQYWRkaW5nKSAqIHUueSkgKiAwLjVcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QTEgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCxcblx0XHRcdFx0XHRcdFx0eTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0eyB4OiB0ZXh0TWFyZ2luLnggLSBuLngsIHk6IHRleHRNYXJnaW4ueSAtIG4ueSB9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCwgeTogdGV4dE1hcmdpbi55IH0sIGFuZ2xlKSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LFxuXHRcdFx0XHRcdFx0XHR5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyID0gcm90YXRlUG9pbnQoXG5cdFx0XHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gdGV4dE1hcmdpbi54IC0gbi54LFxuXHRcdFx0XHRcdFx0XHR5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIHRleHRNYXJnaW4ueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnggLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnggLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtXG5cdFx0XHRcdFx0XHRcdFx0bi54IC1cblx0XHRcdFx0XHRcdFx0XHR1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSAtXG5cdFx0XHRcdFx0XHRcdFx0dS55ICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLVxuXHRcdFx0XHRcdFx0XHRcdG4ueCArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1Lnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggK1xuXHRcdFx0XHRcdFx0XHRcdCgtbi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLFxuXHRcdFx0XHRcdFx0XHR5OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnkgLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnkgLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSArXG5cdFx0XHRcdFx0XHRcdFx0KC1uLnkgLSB1LnkpICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRcIk0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEExLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMS55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMS54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjEueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzEueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQxLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMS55ICtcblx0XHRcdFx0XHRcIiBaIE0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRFMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEYyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEcyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMi55ICtcblx0XHRcdFx0XHRcIiBaXCJcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpIHtcblx0XHRyZWxhdGlvbnNoaXBPdmVybGF5LmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHR2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG5cdFx0XHRcdGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcblx0XHRcdFx0bjEgPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCwgNTApLFxuXHRcdFx0XHRyb3RhdGVkUG9pbnRBID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgLSBuLngsIHk6IDAgLSBuLnkgfSwgYW5nbGUpLFxuXHRcdFx0XHRyb3RhdGVkUG9pbnRCID0gcm90YXRlUG9pbnQoXG5cdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gbi54LFxuXHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSBuLnlcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdCksXG5cdFx0XHRcdHJvdGF0ZWRQb2ludEMgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggKyBuLnggLSBuMS54LFxuXHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgKyBuLnkgLSBuMS55XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHQpLFxuXHRcdFx0XHRyb3RhdGVkUG9pbnREID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgKyBuLnggLSBuMS54LCB5OiAwICsgbi55IC0gbjEueSB9LCBhbmdsZSk7XG5cblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFwiTSBcIiArXG5cdFx0XHRcdHJvdGF0ZWRQb2ludEEueCArXG5cdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50QS55ICtcblx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdHJvdGF0ZWRQb2ludEIueCArXG5cdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qi55ICtcblx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdHJvdGF0ZWRQb2ludEMueCArXG5cdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qy55ICtcblx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdHJvdGF0ZWRQb2ludEQueCArXG5cdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50RC55ICtcblx0XHRcdFx0XCIgWlwiXG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNUZXh0cygpIHtcblx0XHRyZWxhdGlvbnNoaXBUZXh0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHZhciBhbmdsZSA9IChyb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpICsgMzYwKSAlIDM2MCxcblx0XHRcdFx0bWlycm9yID0gYW5nbGUgPiA5MCAmJiBhbmdsZSA8IDI3MCxcblx0XHRcdFx0Y2VudGVyID0geyB4OiAwLCB5OiAwIH0sXG5cdFx0XHRcdG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdG5XZWlnaHQgPSBtaXJyb3IgPyAyIDogLTMsXG5cdFx0XHRcdHBvaW50ID0ge1xuXHRcdFx0XHRcdHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCkgKiAwLjUgKyBuLnggKiBuV2VpZ2h0LFxuXHRcdFx0XHRcdHk6IChkLnRhcmdldC55IC0gZC5zb3VyY2UueSkgKiAwLjUgKyBuLnkgKiBuV2VpZ2h0XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJvdGF0ZWRQb2ludCA9IHJvdGF0ZVBvaW50KGNlbnRlciwgcG9pbnQsIGFuZ2xlKTtcblxuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XCJ0cmFuc2xhdGUoXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnQueCArXG5cdFx0XHRcdFwiLCBcIiArXG5cdFx0XHRcdHJvdGF0ZWRQb2ludC55ICtcblx0XHRcdFx0XCIpIHJvdGF0ZShcIiArXG5cdFx0XHRcdChtaXJyb3IgPyAxODAgOiAwKSArXG5cdFx0XHRcdFwiKVwiXG5cdFx0XHQpO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdG9TdHJpbmcoZCkge1xuXHRcdHZhciBzID0gZC5sYWJlbHMgPyBkLmxhYmVsc1swXSA6IGQudHlwZTtcblxuXHRcdHMgKz0gXCIgKDxpZD46IFwiICsgZC5pZDtcblxuXHRcdE9iamVjdC5rZXlzKGQucHJvcGVydGllcykuZm9yRWFjaChmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0XHRcdHMgKz0gXCIsIFwiICsgcHJvcGVydHkgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkLnByb3BlcnRpZXNbcHJvcGVydHldKTtcblx0XHR9KTtcblxuXHRcdHMgKz0gXCIpXCI7XG5cblx0XHRyZXR1cm4gcztcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlOb3JtYWxWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdHZhciBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfSxcblx0XHRcdHZlY3RvciA9IHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCk7XG5cblx0XHRyZXR1cm4gcm90YXRlUG9pbnQoY2VudGVyLCB2ZWN0b3IsIDkwKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdHZhciBsZW5ndGggPVxuXHRcdFx0TWF0aC5zcXJ0KE1hdGgucG93KHRhcmdldC54IC0gc291cmNlLngsIDIpICsgTWF0aC5wb3codGFyZ2V0LnkgLSBzb3VyY2UueSwgMikpIC9cblx0XHRcdE1hdGguc3FydChuZXdMZW5ndGggfHwgMSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0eDogKHRhcmdldC54IC0gc291cmNlLngpIC8gbGVuZ3RoLFxuXHRcdFx0eTogKHRhcmdldC55IC0gc291cmNlLnkpIC8gbGVuZ3RoXG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVdpdGhEM0RhdGEoZDNEYXRhKSB7XG5cdFx0dXBkYXRlTm9kZXNBbmRSZWxhdGlvbnNoaXBzKGQzRGF0YS5ub2RlcywgZDNEYXRhLnJlbGF0aW9uc2hpcHMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlV2l0aE5lbzRqRGF0YShuZW80akRhdGEpIHtcblx0XHR2YXIgZDNEYXRhID0gbmVvNGpEYXRhVG9EM0RhdGEobmVvNGpEYXRhKTtcblx0XHR1cGRhdGVXaXRoRDNEYXRhKGQzRGF0YSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVJbmZvKGQpIHtcblx0XHRjbGVhckluZm8oKTtcblxuXHRcdGlmIChkLmxhYmVscykge1xuXHRcdFx0YXBwZW5kSW5mb0VsZW1lbnRDbGFzcyhcImNsYXNzXCIsIGQubGFiZWxzWzBdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXBwZW5kSW5mb0VsZW1lbnRSZWxhdGlvbnNoaXAoXCJjbGFzc1wiLCBkLnR5cGUpO1xuXHRcdH1cblxuXHRcdGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoXCJwcm9wZXJ0eVwiLCBcIiZsdDtpZCZndDtcIiwgZC5pZCk7XG5cblx0XHRPYmplY3Qua2V5cyhkLnByb3BlcnRpZXMpLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdFx0XHRhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KFwicHJvcGVydHlcIiwgcHJvcGVydHksIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pKTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZU5vZGVzKG4pIHtcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShub2Rlcywgbik7XG5cblx0XHRub2RlID0gc3ZnTm9kZXMuc2VsZWN0QWxsKFwiLm5vZGVcIikuZGF0YShub2RlcywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmlkO1xuXHRcdH0pO1xuXHRcdHZhciBub2RlRW50ZXIgPSBhcHBlbmROb2RlVG9HcmFwaCgpO1xuXHRcdG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMobiwgcikge1xuXHRcdHVwZGF0ZVJlbGF0aW9uc2hpcHMocik7XG5cdFx0dXBkYXRlTm9kZXMobik7XG5cblx0XHRzaW11bGF0aW9uLm5vZGVzKG5vZGVzKTtcblx0XHRzaW11bGF0aW9uLmZvcmNlKFwibGlua1wiKS5saW5rcyhyZWxhdGlvbnNoaXBzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVJlbGF0aW9uc2hpcHMocikge1xuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHJlbGF0aW9uc2hpcHMsIHIpO1xuXG5cdFx0cmVsYXRpb25zaGlwID0gc3ZnUmVsYXRpb25zaGlwcy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwXCIpLmRhdGEocmVsYXRpb25zaGlwcywgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmlkO1xuXHRcdH0pO1xuXG5cdFx0dmFyIHJlbGF0aW9uc2hpcEVudGVyID0gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpO1xuXG5cdFx0cmVsYXRpb25zaGlwID0gcmVsYXRpb25zaGlwRW50ZXIucmVsYXRpb25zaGlwLm1lcmdlKHJlbGF0aW9uc2hpcCk7XG5cblx0XHRyZWxhdGlvbnNoaXBPdXRsaW5lID0gc3ZnLnNlbGVjdEFsbChcIi5yZWxhdGlvbnNoaXAgLm91dGxpbmVcIik7XG5cdFx0cmVsYXRpb25zaGlwT3V0bGluZSA9IHJlbGF0aW9uc2hpcEVudGVyLm91dGxpbmUubWVyZ2UocmVsYXRpb25zaGlwT3V0bGluZSk7XG5cblx0XHRyZWxhdGlvbnNoaXBPdmVybGF5ID0gc3ZnLnNlbGVjdEFsbChcIi5yZWxhdGlvbnNoaXAgLm92ZXJsYXlcIik7XG5cdFx0cmVsYXRpb25zaGlwT3ZlcmxheSA9IHJlbGF0aW9uc2hpcEVudGVyLm92ZXJsYXkubWVyZ2UocmVsYXRpb25zaGlwT3ZlcmxheSk7XG5cblx0XHRyZWxhdGlvbnNoaXBUZXh0ID0gc3ZnLnNlbGVjdEFsbChcIi5yZWxhdGlvbnNoaXAgLnRleHRcIik7XG5cdFx0cmVsYXRpb25zaGlwVGV4dCA9IHJlbGF0aW9uc2hpcEVudGVyLnRleHQubWVyZ2UocmVsYXRpb25zaGlwVGV4dCk7XG5cdH1cblxuXHRmdW5jdGlvbiB2ZXJzaW9uKCkge1xuXHRcdHJldHVybiBWRVJTSU9OO1xuXHR9XG5cblx0ZnVuY3Rpb24gem9vbUZpdCh0cmFuc2l0aW9uRHVyYXRpb24pIHtcblx0XHR2YXIgYm91bmRzID0gc3ZnLm5vZGUoKS5nZXRCQm94KCksXG5cdFx0XHRwYXJlbnQgPSBzdmcubm9kZSgpLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCxcblx0XHRcdGZ1bGxXaWR0aCA9IHBhcmVudC5jbGllbnRXaWR0aCxcblx0XHRcdGZ1bGxIZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0LFxuXHRcdFx0d2lkdGggPSBib3VuZHMud2lkdGgsXG5cdFx0XHRoZWlnaHQgPSBib3VuZHMuaGVpZ2h0LFxuXHRcdFx0bWlkWCA9IGJvdW5kcy54ICsgd2lkdGggLyAyLFxuXHRcdFx0bWlkWSA9IGJvdW5kcy55ICsgaGVpZ2h0IC8gMjtcblxuXHRcdGlmICh3aWR0aCA9PT0gMCB8fCBoZWlnaHQgPT09IDApIHtcblx0XHRcdHJldHVybjsgLy8gbm90aGluZyB0byBmaXRcblx0XHR9XG5cblx0XHRzdmdTY2FsZSA9IDAuODUgLyBNYXRoLm1heCh3aWR0aCAvIGZ1bGxXaWR0aCwgaGVpZ2h0IC8gZnVsbEhlaWdodCk7XG5cdFx0c3ZnVHJhbnNsYXRlID0gW2Z1bGxXaWR0aCAvIDIgLSBzdmdTY2FsZSAqIG1pZFgsIGZ1bGxIZWlnaHQgLyAyIC0gc3ZnU2NhbGUgKiBtaWRZXTtcblxuXHRcdHN2Zy5hdHRyKFxuXHRcdFx0XCJ0cmFuc2Zvcm1cIixcblx0XHRcdFwidHJhbnNsYXRlKFwiICsgc3ZnVHJhbnNsYXRlWzBdICsgXCIsIFwiICsgc3ZnVHJhbnNsYXRlWzFdICsgXCIpIHNjYWxlKFwiICsgc3ZnU2NhbGUgKyBcIilcIlxuXHRcdCk7XG5cdFx0Ly8gICAgICAgIHNtb290aFRyYW5zZm9ybShzdmdUcmFuc2xhdGUsIHN2Z1NjYWxlKTtcblx0fVxuXG5cdGluaXQoX3NlbGVjdG9yLCBfb3B0aW9ucyk7XG5cblx0cmV0dXJuIHtcblx0XHRhcHBlbmRSYW5kb21EYXRhVG9Ob2RlOiBhcHBlbmRSYW5kb21EYXRhVG9Ob2RlLFxuXHRcdG5lbzRqRGF0YVRvRDNEYXRhOiBuZW80akRhdGFUb0QzRGF0YSxcblx0XHRyYW5kb21EM0RhdGE6IHJhbmRvbUQzRGF0YSxcblx0XHRyZXNldFdpdGhOZW80akRhdGE6IHJlc2V0V2l0aE5lbzRqRGF0YSxcblx0XHRzaXplOiBzaXplLFxuXHRcdHVwZGF0ZVdpdGhEM0RhdGE6IHVwZGF0ZVdpdGhEM0RhdGEsXG5cdFx0dXBkYXRlV2l0aE5lbzRqRGF0YTogdXBkYXRlV2l0aE5lbzRqRGF0YSxcblx0XHR2ZXJzaW9uOiB2ZXJzaW9uXG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmVvNGpEMztcbiJdfQ==
