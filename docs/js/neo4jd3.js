(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Neo4jd3 = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){
"use strict";

const neo4jd3 = _dereq_("./scripts/neo4jd3");

module.exports = neo4jd3;

},{"./scripts/neo4jd3":2}],2:[function(_dereq_,module,exports){
/* global d3, document */
/* jshint latedef:nofunc */
"use strict";

function Neo4jD3(_selector, _options) {
	var container,
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
					let scale = event.transform.k;
					let translate = [event.transform.x, event.transform.y];

					if (svgTranslate) {
						translate[0] += svgTranslate[0];
						translate[1] += svgTranslate[1];
					}

					if (svgScale) {
						scale *= svgScale;
					}

					svg.attr(
						"transform",
						`translate(${translate[0]}, ${translate[1]}) scale(${scale})`
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
		const elem = info.append("a");

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
				let classes = "node";

				if (icon(d)) {
					classes += " node-icon";
				}

				if (image(d)) {
					classes += " node-image";
				}

				if (options.highlight) {
					for (let i = 0; i < options.highlight.length; i++) {
						let highlight = options.highlight[i];

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
			.on("click", function (event, d) {
				d.fx = d.fy = null;

				if (typeof options.onNodeClick === "function") {
					options.onNodeClick(d);
				}
			})
			.on("dblclick", function (event, d) {
				stickNode(event, d);

				if (typeof options.onNodeDoubleClick === "function") {
					options.onNodeDoubleClick(d);
				}
			})
			.on("mouseenter", function (event, d) {
				if (info) {
					updateInfo(d);
				}

				if (typeof options.onNodeMouseEnter === "function") {
					options.onNodeMouseEnter(d);
				}
			})
			.on("mouseleave", function (event, d) {
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
		const n = appendNode();

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
		const data = randomD3Data(d, maxNodesToGenerate);
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
			.on("mouseenter", function (event, d) {
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
		const relationship = appendRelationship();
		const text = appendTextToRelationship(relationship);
		const outline = appendOutlineToRelationship(relationship);
		const overlay = appendOverlayToRelationship(relationship);

		return {
			outline,
			overlay,
			relationship,
			text
		};
	}

	function class2color(cls) {
		let color = classes2colors[cls];

		if (!color) {
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

	function colors() {
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
		const filter = array.filter((elem) => elem.id === id);
		return filter.length > 0;
	}

	function defaultColor() {
		return options.relationshipColor;
	}

	function defaultDarkenColor() {
		return d3.rgb(options.colors[options.colors.length - 1]).darker(1);
	}

	function dragEnded(event, d) {
		if (!event.active) {
			simulation.alphaTarget(0);
		}

		if (typeof options.onNodeDragEnd === "function") {
			options.onNodeDragEnd(d);
		}
	}

	function dragged(event, d) {
		stickNode(event, d);
	}

	function dragStarted(event, d) {
		if (!event.active) {
			simulation.alphaTarget(0.3).restart();
		}

		d.fx = d.x;
		d.fy = d.y;

		if (typeof options.onNodeDragStart === "function") {
			options.onNodeDragStart(d);
		}
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
		let code;

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
		let imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

		if (options.images) {
			imagesForLabel = options.imageMap[d.labels[0]];

			if (imagesForLabel) {
				imgLevel = 0;

				for (let i = 0; i < imagesForLabel.length; i++) {
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
		Object.keys(options.iconMap).forEach(function (key) {
			const keys = key.split(",");
			const value = options.iconMap[key];

			keys.forEach(function (key) {
				options.iconMap[key] = value;
			});
		});
	}

	function initImageMap() {
		let keys;

		for (const key in options.images) {
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

	// TODO: Make this optional
	function initSimulation() {
		const simulation = d3
			.forceSimulation()
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

		d3.json(neo4jDataUrl)
			.then((data) => {
				updateWithNeo4jData(data);
			})
			.catch((error) => {
				throw error;
			});
	}

	function merge(target, source) {
		Object.keys(source).forEach(function (property) {
			target[property] = source[property];
		});
	}

	function neo4jDataToD3Data(data) {
		const graph = {
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
						return a.target < b.target ? -1 : 0;
					}
				});

				for (let i = 0; i < data.graph.relationships.length; i++) {
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
		const data = {
			nodes: [],
			relationships: []
		};
		const numNodes = ((maxNodesToGenerate * Math.random()) << 0) + 1;
		const s = size();

		let relationship;
		let label;
		let node;

		for (let i = 0; i < numNodes; i++) {
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
		const icons = Object.keys(options.iconMap);
		return icons[(icons.length * Math.random()) << 0];
	}

	function resetWithNeo4jData(neo4jData) {
		// Call the init method again with new data
		const newOptions = Object.assign(_options, {
			neo4jData: neo4jData,
			neo4jDataUrl: undefined
		});
		init(_selector, newOptions);
	}

	function rotate(cx, cy, x, y, angle) {
		const radians = (Math.PI / 180) * angle;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		const nx = cos * (x - cx) + sin * (y - cy) + cx;
		const ny = cos * (y - cy) - sin * (x - cx) + cy;

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

	function stickNode(event, d) {
		d.fx = event.x;
		d.fy = event.y;
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
				const angle = rotation(d.source, d.target);
				return `translate(${d.source.x}, ${d.source.y}) rotate(${angle})`;
			});

			tickRelationshipsTexts();
			tickRelationshipsOutlines();
			tickRelationshipsOverlays();
		}
	}

	function tickRelationshipsOutlines() {
		relationship.each(function (relationship) {
			const rel = d3.select(this);
			const outline = rel.select(".outline");
			const text = rel.select(".text");

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
			const center = { x: 0, y: 0 };
			const angle = rotation(d.source, d.target);
			const n1 = unitaryNormalVector(d.source, d.target);
			const n = unitaryNormalVector(d.source, d.target, 50);
			const rotatedPointA = rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle);
			const rotatedPointB = rotatePoint(
				center,
				{
					x: d.target.x - d.source.x - n.x,
					y: d.target.y - d.source.y - n.y
				},
				angle
			);
			const rotatedPointC = rotatePoint(
				center,
				{
					x: d.target.x - d.source.x + n.x - n1.x,
					y: d.target.y - d.source.y + n.y - n1.y
				},
				angle
			);
			const rotatedPointD = rotatePoint(center, { x: 0 + n.x - n1.x, y: 0 + n.y - n1.y }, angle);

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
			const angle = (rotation(d.source, d.target) + 360) % 360;
			const mirror = angle > 90 && angle < 270;
			const center = { x: 0, y: 0 };
			const n = unitaryNormalVector(d.source, d.target);
			const nWeight = mirror ? 2 : -3;
			const point = {
				x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
				y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
			};
			const rotatedPoint = rotatePoint(center, point, angle);

			return (
				`translate(${rotatedPoint.x}, ${rotatedPoint.y})` +
				`rotate(${mirror ? 180 : 0})`
			);
		});
	}

	function toString(d) {
		let s = d.labels ? d.labels[0] : d.type;
		s += " (<id>: " + d.id;

		Object.keys(d.properties).forEach(function (property) {
			s += ", " + property + ": " + JSON.stringify(d.properties[property]);
		});

		s += ")";
		return s;
	}

	function unitaryNormalVector(source, target, newLength) {
		const center = { x: 0, y: 0 };
		const vector = unitaryVector(source, target, newLength);

		return rotatePoint(center, vector, 90);
	}

	function unitaryVector(source, target, newLength) {
		const length =
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
		const d3Data = neo4jDataToD3Data(neo4jData);
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
		node = svgNodes.selectAll(".node").data(nodes, (d) => d.id);

		const nodeEnter = appendNodeToGraph();
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
		relationship = svgRelationships.selectAll(".relationship").data(relationships, (d) => d.id);

		const relationshipEnter = appendRelationshipToGraph();
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
		const bounds = svg.node().getBBox();
		const parent = svg.node().parentElement.parentElement;
		const fullWidth = parent.clientWidth;
		const fullHeight = parent.clientHeight;
		const width = bounds.width;
		const height = bounds.height;
		const midX = bounds.x + width / 2;
		const midY = bounds.y + height / 2;

		if (width === 0 || height === 0) {
			// nothing to fit
			return;
		}

		svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
		svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

		svg.attr(
			"transform",
			`translate(${svgTranslate[0]}, ${svgTranslate[1]}) scale(${svgScale})`
		);
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy8ucG5wbS9icm93c2VyLXBhY2tANi4xLjAvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluL2luZGV4LmpzIiwic3JjL21haW4vc2NyaXB0cy9uZW80amQzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgbmVvNGpkMyA9IHJlcXVpcmUoXCIuL3NjcmlwdHMvbmVvNGpkM1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZW80amQzO1xuIiwiLyogZ2xvYmFsIGQzLCBkb2N1bWVudCAqL1xuLyoganNoaW50IGxhdGVkZWY6bm9mdW5jICovXG5cInVzZSBzdHJpY3RcIjtcblxuZnVuY3Rpb24gTmVvNGpEMyhfc2VsZWN0b3IsIF9vcHRpb25zKSB7XG5cdHZhciBjb250YWluZXIsXG5cdFx0aW5mbyxcblx0XHRub2RlLFxuXHRcdG5vZGVzLFxuXHRcdHJlbGF0aW9uc2hpcCxcblx0XHRyZWxhdGlvbnNoaXBPdXRsaW5lLFxuXHRcdHJlbGF0aW9uc2hpcE92ZXJsYXksXG5cdFx0cmVsYXRpb25zaGlwVGV4dCxcblx0XHRyZWxhdGlvbnNoaXBzLFxuXHRcdHNlbGVjdG9yLFxuXHRcdHNpbXVsYXRpb24sXG5cdFx0c3ZnLFxuXHRcdHN2Z05vZGVzLFxuXHRcdHN2Z1JlbGF0aW9uc2hpcHMsXG5cdFx0c3ZnU2NhbGUsXG5cdFx0c3ZnVHJhbnNsYXRlLFxuXHRcdGNsYXNzZXMyY29sb3JzID0ge30sXG5cdFx0anVzdExvYWRlZCA9IGZhbHNlLFxuXHRcdG51bUNsYXNzZXMgPSAwLFxuXHRcdG9wdGlvbnMgPSB7XG5cdFx0XHRhcnJvd1NpemU6IDQsXG5cdFx0XHRjb2xvcnM6IGNvbG9ycygpLFxuXHRcdFx0aGlnaGxpZ2h0OiB1bmRlZmluZWQsXG5cdFx0XHRpY29uTWFwOiBmb250QXdlc29tZUljb25zKCksXG5cdFx0XHRpY29uczogdW5kZWZpbmVkLFxuXHRcdFx0aW1hZ2VNYXA6IHt9LFxuXHRcdFx0aW1hZ2VzOiB1bmRlZmluZWQsXG5cdFx0XHRpbmZvUGFuZWw6IHRydWUsXG5cdFx0XHRtaW5Db2xsaXNpb246IHVuZGVmaW5lZCxcblx0XHRcdG5lbzRqRGF0YTogdW5kZWZpbmVkLFxuXHRcdFx0bmVvNGpEYXRhVXJsOiB1bmRlZmluZWQsXG5cdFx0XHRub2RlT3V0bGluZUZpbGxDb2xvcjogdW5kZWZpbmVkLFxuXHRcdFx0bm9kZVJhZGl1czogMjUsXG5cdFx0XHRub2RlVGV4dFByb3BlcnR5OiB1bmRlZmluZWQsXG5cdFx0XHRub2RlVGV4dENvbG9yOiBcIiNmZmZmZmZcIixcblx0XHRcdHJlbGF0aW9uc2hpcENvbG9yOiBcIiNhNWFiYjZcIixcblx0XHRcdHpvb21GaXQ6IGZhbHNlXG5cdFx0fSxcblx0XHRWRVJTSU9OID0gXCIwLjAuMVwiO1xuXG5cdGZ1bmN0aW9uIGFwcGVuZEdyYXBoKGNvbnRhaW5lcikge1xuXHRcdHN2ZyA9IGNvbnRhaW5lclxuXHRcdFx0LmFwcGVuZChcInN2Z1wiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcIm5lbzRqZDMtZ3JhcGhcIilcblx0XHRcdC5jYWxsKFxuXHRcdFx0XHRkMy56b29tKCkub24oXCJ6b29tXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdFx0XHRcdGxldCBzY2FsZSA9IGV2ZW50LnRyYW5zZm9ybS5rO1xuXHRcdFx0XHRcdGxldCB0cmFuc2xhdGUgPSBbZXZlbnQudHJhbnNmb3JtLngsIGV2ZW50LnRyYW5zZm9ybS55XTtcblxuXHRcdFx0XHRcdGlmIChzdmdUcmFuc2xhdGUpIHtcblx0XHRcdFx0XHRcdHRyYW5zbGF0ZVswXSArPSBzdmdUcmFuc2xhdGVbMF07XG5cdFx0XHRcdFx0XHR0cmFuc2xhdGVbMV0gKz0gc3ZnVHJhbnNsYXRlWzFdO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzdmdTY2FsZSkge1xuXHRcdFx0XHRcdFx0c2NhbGUgKj0gc3ZnU2NhbGU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3ZnLmF0dHIoXG5cdFx0XHRcdFx0XHRcInRyYW5zZm9ybVwiLFxuXHRcdFx0XHRcdFx0YHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVswXX0sICR7dHJhbnNsYXRlWzFdfSkgc2NhbGUoJHtzY2FsZX0pYFxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0pXG5cdFx0XHQpXG5cdFx0XHQub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXG5cdFx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcblxuXHRcdHN2Z1JlbGF0aW9uc2hpcHMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJyZWxhdGlvbnNoaXBzXCIpO1xuXG5cdFx0c3ZnTm9kZXMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJub2Rlc1wiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEltYWdlVG9Ob2RlKG5vZGUpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmFwcGVuZChcImltYWdlXCIpXG5cdFx0XHQuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gXCI1cHhcIiA6IFwiLTE1cHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIGltYWdlKGQpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiNXB4XCIgOiBcIi0xNnB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpIHtcblx0XHRyZXR1cm4gY29udGFpbmVyLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJuZW80amQzLWluZm9cIik7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG5cdFx0Y29uc3QgZWxlbSA9IGluZm8uYXBwZW5kKFwiYVwiKTtcblxuXHRcdGVsZW1cblx0XHRcdC5hdHRyKFwiaHJlZlwiLCBcIiNcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgY2xzKVxuXHRcdFx0Lmh0bWwoXCI8c3Ryb25nPlwiICsgcHJvcGVydHkgKyBcIjwvc3Ryb25nPlwiICsgKHZhbHVlID8gXCI6IFwiICsgdmFsdWUgOiBcIlwiKSk7XG5cblx0XHRpZiAoIXZhbHVlKSB7XG5cdFx0XHRlbGVtXG5cdFx0XHRcdC5zdHlsZShcImJhY2tncm91bmQtY29sb3JcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvclxuXHRcdFx0XHRcdFx0PyBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yXG5cdFx0XHRcdFx0XHQ6IGlzTm9kZVxuXHRcdFx0XHRcdFx0PyBjbGFzczJjb2xvcihwcm9wZXJ0eSlcblx0XHRcdFx0XHRcdDogZGVmYXVsdENvbG9yKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5zdHlsZShcImJvcmRlci1jb2xvclwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdHJldHVybiBvcHRpb25zLm5vZGVPdXRsaW5lRmlsbENvbG9yXG5cdFx0XHRcdFx0XHQ/IGNsYXNzMmRhcmtlbkNvbG9yKG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IpXG5cdFx0XHRcdFx0XHQ6IGlzTm9kZVxuXHRcdFx0XHRcdFx0PyBjbGFzczJkYXJrZW5Db2xvcihwcm9wZXJ0eSlcblx0XHRcdFx0XHRcdDogZGVmYXVsdERhcmtlbkNvbG9yKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5zdHlsZShcImNvbG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHRcdD8gY2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcilcblx0XHRcdFx0XHRcdDogXCIjZmZmXCI7XG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoY2xzLCBub2RlKSB7XG5cdFx0YXBwZW5kSW5mb0VsZW1lbnQoY2xzLCB0cnVlLCBub2RlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoY2xzLCBwcm9wZXJ0eSwgdmFsdWUpIHtcblx0XHRhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRSZWxhdGlvbnNoaXAoY2xzLCByZWxhdGlvbnNoaXApIHtcblx0XHRhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCByZWxhdGlvbnNoaXApO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kTm9kZSgpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmVudGVyKClcblx0XHRcdC5hcHBlbmQoXCJnXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdGxldCBjbGFzc2VzID0gXCJub2RlXCI7XG5cblx0XHRcdFx0aWYgKGljb24oZCkpIHtcblx0XHRcdFx0XHRjbGFzc2VzICs9IFwiIG5vZGUtaWNvblwiO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGltYWdlKGQpKSB7XG5cdFx0XHRcdFx0Y2xhc3NlcyArPSBcIiBub2RlLWltYWdlXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3B0aW9ucy5oaWdobGlnaHQpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRsZXQgaGlnaGxpZ2h0ID0gb3B0aW9ucy5oaWdobGlnaHRbaV07XG5cblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0ZC5sYWJlbHNbMF0gPT09IGhpZ2hsaWdodC5jbGFzcyAmJlxuXHRcdFx0XHRcdFx0XHRkLnByb3BlcnRpZXNbaGlnaGxpZ2h0LnByb3BlcnR5XSA9PT0gaGlnaGxpZ2h0LnZhbHVlXG5cdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0Y2xhc3NlcyArPSBcIiBub2RlLWhpZ2hsaWdodGVkXCI7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBjbGFzc2VzO1xuXHRcdFx0fSlcblx0XHRcdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCwgZCkge1xuXHRcdFx0XHRkLmZ4ID0gZC5meSA9IG51bGw7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZUNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRvcHRpb25zLm9uTm9kZUNsaWNrKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50LCBkKSB7XG5cdFx0XHRcdHN0aWNrTm9kZShldmVudCwgZCk7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZURvdWJsZUNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRvcHRpb25zLm9uTm9kZURvdWJsZUNsaWNrKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQsIGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHR1cGRhdGVJbmZvKGQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZU1vdXNlRW50ZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdG9wdGlvbnMub25Ob2RlTW91c2VFbnRlcihkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5vbihcIm1vdXNlbGVhdmVcIiwgZnVuY3Rpb24gKGV2ZW50LCBkKSB7XG5cdFx0XHRcdGlmIChpbmZvKSB7XG5cdFx0XHRcdFx0Y2xlYXJJbmZvKGQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZU1vdXNlTGVhdmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZShkKTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5jYWxsKGQzLmRyYWcoKS5vbihcInN0YXJ0XCIsIGRyYWdTdGFydGVkKS5vbihcImRyYWdcIiwgZHJhZ2dlZCkub24oXCJlbmRcIiwgZHJhZ0VuZGVkKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmROb2RlVG9HcmFwaCgpIHtcblx0XHRjb25zdCBuID0gYXBwZW5kTm9kZSgpO1xuXG5cdFx0YXBwZW5kUmluZ1RvTm9kZShuKTtcblx0XHRhcHBlbmRPdXRsaW5lVG9Ob2RlKG4pO1xuXG5cdFx0aWYgKG9wdGlvbnMuaWNvbnMpIHtcblx0XHRcdGFwcGVuZFRleHRUb05vZGUobik7XG5cdFx0fVxuXG5cdFx0aWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG5cdFx0XHRhcHBlbmRJbWFnZVRvTm9kZShuKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb05vZGUobm9kZSkge1xuXHRcdHJldHVybiBub2RlXG5cdFx0XHQuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwib3V0bGluZVwiKVxuXHRcdFx0LmF0dHIoXCJyXCIsIG9wdGlvbnMubm9kZVJhZGl1cylcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ/IG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ6IGNsYXNzMmNvbG9yKGQubGFiZWxzWzBdKTtcblx0XHRcdH0pXG5cdFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3Jcblx0XHRcdFx0XHQ/IGNsYXNzMmRhcmtlbkNvbG9yKG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IpXG5cdFx0XHRcdFx0OiBjbGFzczJkYXJrZW5Db2xvcihkLmxhYmVsc1swXSk7XG5cdFx0XHR9KVxuXHRcdFx0LmFwcGVuZChcInRpdGxlXCIpXG5cdFx0XHQudGV4dChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gdG9TdHJpbmcoZCk7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJpbmdUb05vZGUobm9kZSkge1xuXHRcdHJldHVybiBub2RlXG5cdFx0XHQuYXBwZW5kKFwiY2lyY2xlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicmluZ1wiKVxuXHRcdFx0LmF0dHIoXCJyXCIsIG9wdGlvbnMubm9kZVJhZGl1cyAqIDEuMTYpXG5cdFx0XHQuYXBwZW5kKFwidGl0bGVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiB0b1N0cmluZyhkKTtcblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kVGV4dFRvTm9kZShub2RlKSB7XG5cdFx0cmV0dXJuIG5vZGVcblx0XHRcdC5hcHBlbmQoXCJ0ZXh0XCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBcInRleHRcIiArIChpY29uKGQpID8gXCIgaWNvblwiIDogXCJcIik7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIG9wdGlvbnMubm9kZVRleHRDb2xvcilcblx0XHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gb3B0aW9ucy5ub2RlUmFkaXVzICsgXCJweFwiIDogXCIxMHB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IHBhcnNlSW50KE1hdGgucm91bmQob3B0aW9ucy5ub2RlUmFkaXVzICogMC4zMikpICsgXCJweFwiIDogXCI0cHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuaHRtbChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRjb25zdCBfaWNvbiA9IGljb24oZCk7XG5cdFx0XHRcdGxldCB0ZXh0ID0gZC5pZDtcblx0XHRcdFx0aWYgKG9wdGlvbnMubm9kZVRleHRQcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHRleHQgPSBkLnByb3BlcnRpZXNbb3B0aW9ucy5ub2RlVGV4dFByb3BlcnR5XTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBfaWNvbiA/IFwiJiN4XCIgKyBfaWNvbiA6IHRleHQ7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJhbmRvbURhdGFUb05vZGUoZCwgbWF4Tm9kZXNUb0dlbmVyYXRlKSB7XG5cdFx0Y29uc3QgZGF0YSA9IHJhbmRvbUQzRGF0YShkLCBtYXhOb2Rlc1RvR2VuZXJhdGUpO1xuXHRcdHVwZGF0ZVdpdGhOZW80akRhdGEoZGF0YSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRSZWxhdGlvbnNoaXAoKSB7XG5cdFx0cmV0dXJuIHJlbGF0aW9uc2hpcFxuXHRcdFx0LmVudGVyKClcblx0XHRcdC5hcHBlbmQoXCJnXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicmVsYXRpb25zaGlwXCIpXG5cdFx0XHQub24oXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25SZWxhdGlvbnNoaXBEb3VibGVDbGljayA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vblJlbGF0aW9uc2hpcERvdWJsZUNsaWNrKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwibW91c2VlbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQsIGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHR1cGRhdGVJbmZvKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyKSB7XG5cdFx0cmV0dXJuIHIuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvdXRsaW5lXCIpLmF0dHIoXCJmaWxsXCIsIFwiI2E1YWJiNlwiKS5hdHRyKFwic3Ryb2tlXCIsIFwibm9uZVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE92ZXJsYXlUb1JlbGF0aW9uc2hpcChyKSB7XG5cdFx0cmV0dXJuIHIuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvdmVybGF5XCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHIpIHtcblx0XHRyZXR1cm4gclxuXHRcdFx0LmFwcGVuZChcInRleHRcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJ0ZXh0XCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCIjMDAwMDAwXCIpXG5cdFx0XHQuYXR0cihcImZvbnQtc2l6ZVwiLCBcIjhweFwiKVxuXHRcdFx0LmF0dHIoXCJwb2ludGVyLWV2ZW50c1wiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBkLnR5cGU7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcFRvR3JhcGgoKSB7XG5cdFx0Y29uc3QgcmVsYXRpb25zaGlwID0gYXBwZW5kUmVsYXRpb25zaGlwKCk7XG5cdFx0Y29uc3QgdGV4dCA9IGFwcGVuZFRleHRUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xuXHRcdGNvbnN0IG91dGxpbmUgPSBhcHBlbmRPdXRsaW5lVG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKTtcblx0XHRjb25zdCBvdmVybGF5ID0gYXBwZW5kT3ZlcmxheVRvUmVsYXRpb25zaGlwKHJlbGF0aW9uc2hpcCk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0b3V0bGluZSxcblx0XHRcdG92ZXJsYXksXG5cdFx0XHRyZWxhdGlvbnNoaXAsXG5cdFx0XHR0ZXh0XG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNsYXNzMmNvbG9yKGNscykge1xuXHRcdGxldCBjb2xvciA9IGNsYXNzZXMyY29sb3JzW2Nsc107XG5cblx0XHRpZiAoIWNvbG9yKSB7XG5cdFx0XHRjb2xvciA9IG9wdGlvbnMuY29sb3JzW251bUNsYXNzZXMgJSBvcHRpb25zLmNvbG9ycy5sZW5ndGhdO1xuXHRcdFx0Y2xhc3NlczJjb2xvcnNbY2xzXSA9IGNvbG9yO1xuXHRcdFx0bnVtQ2xhc3NlcysrO1xuXHRcdH1cblxuXHRcdHJldHVybiBjb2xvcjtcblx0fVxuXG5cdGZ1bmN0aW9uIGNsYXNzMmRhcmtlbkNvbG9yKGNscykge1xuXHRcdHJldHVybiBkMy5yZ2IoY2xhc3MyY29sb3IoY2xzKSkuZGFya2VyKDEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xlYXJJbmZvKCkge1xuXHRcdGluZm8uaHRtbChcIlwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbG9ycygpIHtcblx0XHRyZXR1cm4gW1xuXHRcdFx0XCIjNjhiZGY2XCIsIC8vIGxpZ2h0IGJsdWVcblx0XHRcdFwiIzZkY2U5ZVwiLCAvLyBncmVlbiAjMVxuXHRcdFx0XCIjZmFhZmMyXCIsIC8vIGxpZ2h0IHBpbmtcblx0XHRcdFwiI2YyYmFmNlwiLCAvLyBwdXJwbGVcblx0XHRcdFwiI2ZmOTI4Y1wiLCAvLyBsaWdodCByZWRcblx0XHRcdFwiI2ZjZWE3ZVwiLCAvLyBsaWdodCB5ZWxsb3dcblx0XHRcdFwiI2ZmYzc2NlwiLCAvLyBsaWdodCBvcmFuZ2Vcblx0XHRcdFwiIzQwNWY5ZVwiLCAvLyBuYXZ5IGJsdWVcblx0XHRcdFwiI2E1YWJiNlwiLCAvLyBkYXJrIGdyYXlcblx0XHRcdFwiIzc4Y2VjYlwiLCAvLyBncmVlbiAjMixcblx0XHRcdFwiI2I4OGNiYlwiLCAvLyBkYXJrIHB1cnBsZVxuXHRcdFx0XCIjY2VkMmQ5XCIsIC8vIGxpZ2h0IGdyYXlcblx0XHRcdFwiI2U4NDY0NlwiLCAvLyBkYXJrIHJlZFxuXHRcdFx0XCIjZmE1Zjg2XCIsIC8vIGRhcmsgcGlua1xuXHRcdFx0XCIjZmZhYjFhXCIsIC8vIGRhcmsgb3JhbmdlXG5cdFx0XHRcIiNmY2RhMTlcIiwgLy8gZGFyayB5ZWxsb3dcblx0XHRcdFwiIzc5N2I4MFwiLCAvLyBibGFja1xuXHRcdFx0XCIjYzlkOTZmXCIsIC8vIHBpc3RhY2NoaW9cblx0XHRcdFwiIzQ3OTkxZlwiLCAvLyBncmVlbiAjM1xuXHRcdFx0XCIjNzBlZGVlXCIsIC8vIHR1cnF1b2lzZVxuXHRcdFx0XCIjZmY3NWVhXCIgLy8gcGlua1xuXHRcdF07XG5cdH1cblxuXHRmdW5jdGlvbiBjb250YWlucyhhcnJheSwgaWQpIHtcblx0XHRjb25zdCBmaWx0ZXIgPSBhcnJheS5maWx0ZXIoKGVsZW0pID0+IGVsZW0uaWQgPT09IGlkKTtcblx0XHRyZXR1cm4gZmlsdGVyLmxlbmd0aCA+IDA7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWZhdWx0Q29sb3IoKSB7XG5cdFx0cmV0dXJuIG9wdGlvbnMucmVsYXRpb25zaGlwQ29sb3I7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWZhdWx0RGFya2VuQ29sb3IoKSB7XG5cdFx0cmV0dXJuIGQzLnJnYihvcHRpb25zLmNvbG9yc1tvcHRpb25zLmNvbG9ycy5sZW5ndGggLSAxXSkuZGFya2VyKDEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ0VuZGVkKGV2ZW50LCBkKSB7XG5cdFx0aWYgKCFldmVudC5hY3RpdmUpIHtcblx0XHRcdHNpbXVsYXRpb24uYWxwaGFUYXJnZXQoMCk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZURyYWdFbmQgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0b3B0aW9ucy5vbk5vZGVEcmFnRW5kKGQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRyYWdnZWQoZXZlbnQsIGQpIHtcblx0XHRzdGlja05vZGUoZXZlbnQsIGQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ1N0YXJ0ZWQoZXZlbnQsIGQpIHtcblx0XHRpZiAoIWV2ZW50LmFjdGl2ZSkge1xuXHRcdFx0c2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwLjMpLnJlc3RhcnQoKTtcblx0XHR9XG5cblx0XHRkLmZ4ID0gZC54O1xuXHRcdGQuZnkgPSBkLnk7XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0ID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdG9wdGlvbnMub25Ob2RlRHJhZ1N0YXJ0KGQpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGZvbnRBd2Vzb21lSWNvbnMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGdsYXNzOiBcImYwMDBcIixcblx0XHRcdG11c2ljOiBcImYwMDFcIixcblx0XHRcdHNlYXJjaDogXCJmMDAyXCIsXG5cdFx0XHRcImVudmVsb3BlLW9cIjogXCJmMDAzXCIsXG5cdFx0XHRoZWFydDogXCJmMDA0XCIsXG5cdFx0XHRzdGFyOiBcImYwMDVcIixcblx0XHRcdFwic3Rhci1vXCI6IFwiZjAwNlwiLFxuXHRcdFx0dXNlcjogXCJmMDA3XCIsXG5cdFx0XHRmaWxtOiBcImYwMDhcIixcblx0XHRcdFwidGgtbGFyZ2VcIjogXCJmMDA5XCIsXG5cdFx0XHR0aDogXCJmMDBhXCIsXG5cdFx0XHRcInRoLWxpc3RcIjogXCJmMDBiXCIsXG5cdFx0XHRjaGVjazogXCJmMDBjXCIsXG5cdFx0XHRcInJlbW92ZSxjbG9zZSx0aW1lc1wiOiBcImYwMGRcIixcblx0XHRcdFwic2VhcmNoLXBsdXNcIjogXCJmMDBlXCIsXG5cdFx0XHRcInNlYXJjaC1taW51c1wiOiBcImYwMTBcIixcblx0XHRcdFwicG93ZXItb2ZmXCI6IFwiZjAxMVwiLFxuXHRcdFx0c2lnbmFsOiBcImYwMTJcIixcblx0XHRcdFwiZ2Vhcixjb2dcIjogXCJmMDEzXCIsXG5cdFx0XHRcInRyYXNoLW9cIjogXCJmMDE0XCIsXG5cdFx0XHRob21lOiBcImYwMTVcIixcblx0XHRcdFwiZmlsZS1vXCI6IFwiZjAxNlwiLFxuXHRcdFx0XCJjbG9jay1vXCI6IFwiZjAxN1wiLFxuXHRcdFx0cm9hZDogXCJmMDE4XCIsXG5cdFx0XHRkb3dubG9hZDogXCJmMDE5XCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1vLWRvd25cIjogXCJmMDFhXCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1vLXVwXCI6IFwiZjAxYlwiLFxuXHRcdFx0aW5ib3g6IFwiZjAxY1wiLFxuXHRcdFx0XCJwbGF5LWNpcmNsZS1vXCI6IFwiZjAxZFwiLFxuXHRcdFx0XCJyb3RhdGUtcmlnaHQscmVwZWF0XCI6IFwiZjAxZVwiLFxuXHRcdFx0cmVmcmVzaDogXCJmMDIxXCIsXG5cdFx0XHRcImxpc3QtYWx0XCI6IFwiZjAyMlwiLFxuXHRcdFx0bG9jazogXCJmMDIzXCIsXG5cdFx0XHRmbGFnOiBcImYwMjRcIixcblx0XHRcdGhlYWRwaG9uZXM6IFwiZjAyNVwiLFxuXHRcdFx0XCJ2b2x1bWUtb2ZmXCI6IFwiZjAyNlwiLFxuXHRcdFx0XCJ2b2x1bWUtZG93blwiOiBcImYwMjdcIixcblx0XHRcdFwidm9sdW1lLXVwXCI6IFwiZjAyOFwiLFxuXHRcdFx0cXJjb2RlOiBcImYwMjlcIixcblx0XHRcdGJhcmNvZGU6IFwiZjAyYVwiLFxuXHRcdFx0dGFnOiBcImYwMmJcIixcblx0XHRcdHRhZ3M6IFwiZjAyY1wiLFxuXHRcdFx0Ym9vazogXCJmMDJkXCIsXG5cdFx0XHRib29rbWFyazogXCJmMDJlXCIsXG5cdFx0XHRwcmludDogXCJmMDJmXCIsXG5cdFx0XHRjYW1lcmE6IFwiZjAzMFwiLFxuXHRcdFx0Zm9udDogXCJmMDMxXCIsXG5cdFx0XHRib2xkOiBcImYwMzJcIixcblx0XHRcdGl0YWxpYzogXCJmMDMzXCIsXG5cdFx0XHRcInRleHQtaGVpZ2h0XCI6IFwiZjAzNFwiLFxuXHRcdFx0XCJ0ZXh0LXdpZHRoXCI6IFwiZjAzNVwiLFxuXHRcdFx0XCJhbGlnbi1sZWZ0XCI6IFwiZjAzNlwiLFxuXHRcdFx0XCJhbGlnbi1jZW50ZXJcIjogXCJmMDM3XCIsXG5cdFx0XHRcImFsaWduLXJpZ2h0XCI6IFwiZjAzOFwiLFxuXHRcdFx0XCJhbGlnbi1qdXN0aWZ5XCI6IFwiZjAzOVwiLFxuXHRcdFx0bGlzdDogXCJmMDNhXCIsXG5cdFx0XHRcImRlZGVudCxvdXRkZW50XCI6IFwiZjAzYlwiLFxuXHRcdFx0aW5kZW50OiBcImYwM2NcIixcblx0XHRcdFwidmlkZW8tY2FtZXJhXCI6IFwiZjAzZFwiLFxuXHRcdFx0XCJwaG90byxpbWFnZSxwaWN0dXJlLW9cIjogXCJmMDNlXCIsXG5cdFx0XHRwZW5jaWw6IFwiZjA0MFwiLFxuXHRcdFx0XCJtYXAtbWFya2VyXCI6IFwiZjA0MVwiLFxuXHRcdFx0YWRqdXN0OiBcImYwNDJcIixcblx0XHRcdHRpbnQ6IFwiZjA0M1wiLFxuXHRcdFx0XCJlZGl0LHBlbmNpbC1zcXVhcmUtb1wiOiBcImYwNDRcIixcblx0XHRcdFwic2hhcmUtc3F1YXJlLW9cIjogXCJmMDQ1XCIsXG5cdFx0XHRcImNoZWNrLXNxdWFyZS1vXCI6IFwiZjA0NlwiLFxuXHRcdFx0YXJyb3dzOiBcImYwNDdcIixcblx0XHRcdFwic3RlcC1iYWNrd2FyZFwiOiBcImYwNDhcIixcblx0XHRcdFwiZmFzdC1iYWNrd2FyZFwiOiBcImYwNDlcIixcblx0XHRcdGJhY2t3YXJkOiBcImYwNGFcIixcblx0XHRcdHBsYXk6IFwiZjA0YlwiLFxuXHRcdFx0cGF1c2U6IFwiZjA0Y1wiLFxuXHRcdFx0c3RvcDogXCJmMDRkXCIsXG5cdFx0XHRmb3J3YXJkOiBcImYwNGVcIixcblx0XHRcdFwiZmFzdC1mb3J3YXJkXCI6IFwiZjA1MFwiLFxuXHRcdFx0XCJzdGVwLWZvcndhcmRcIjogXCJmMDUxXCIsXG5cdFx0XHRlamVjdDogXCJmMDUyXCIsXG5cdFx0XHRcImNoZXZyb24tbGVmdFwiOiBcImYwNTNcIixcblx0XHRcdFwiY2hldnJvbi1yaWdodFwiOiBcImYwNTRcIixcblx0XHRcdFwicGx1cy1jaXJjbGVcIjogXCJmMDU1XCIsXG5cdFx0XHRcIm1pbnVzLWNpcmNsZVwiOiBcImYwNTZcIixcblx0XHRcdFwidGltZXMtY2lyY2xlXCI6IFwiZjA1N1wiLFxuXHRcdFx0XCJjaGVjay1jaXJjbGVcIjogXCJmMDU4XCIsXG5cdFx0XHRcInF1ZXN0aW9uLWNpcmNsZVwiOiBcImYwNTlcIixcblx0XHRcdFwiaW5mby1jaXJjbGVcIjogXCJmMDVhXCIsXG5cdFx0XHRjcm9zc2hhaXJzOiBcImYwNWJcIixcblx0XHRcdFwidGltZXMtY2lyY2xlLW9cIjogXCJmMDVjXCIsXG5cdFx0XHRcImNoZWNrLWNpcmNsZS1vXCI6IFwiZjA1ZFwiLFxuXHRcdFx0YmFuOiBcImYwNWVcIixcblx0XHRcdFwiYXJyb3ctbGVmdFwiOiBcImYwNjBcIixcblx0XHRcdFwiYXJyb3ctcmlnaHRcIjogXCJmMDYxXCIsXG5cdFx0XHRcImFycm93LXVwXCI6IFwiZjA2MlwiLFxuXHRcdFx0XCJhcnJvdy1kb3duXCI6IFwiZjA2M1wiLFxuXHRcdFx0XCJtYWlsLWZvcndhcmQsc2hhcmVcIjogXCJmMDY0XCIsXG5cdFx0XHRleHBhbmQ6IFwiZjA2NVwiLFxuXHRcdFx0Y29tcHJlc3M6IFwiZjA2NlwiLFxuXHRcdFx0cGx1czogXCJmMDY3XCIsXG5cdFx0XHRtaW51czogXCJmMDY4XCIsXG5cdFx0XHRhc3RlcmlzazogXCJmMDY5XCIsXG5cdFx0XHRcImV4Y2xhbWF0aW9uLWNpcmNsZVwiOiBcImYwNmFcIixcblx0XHRcdGdpZnQ6IFwiZjA2YlwiLFxuXHRcdFx0bGVhZjogXCJmMDZjXCIsXG5cdFx0XHRmaXJlOiBcImYwNmRcIixcblx0XHRcdGV5ZTogXCJmMDZlXCIsXG5cdFx0XHRcImV5ZS1zbGFzaFwiOiBcImYwNzBcIixcblx0XHRcdFwid2FybmluZyxleGNsYW1hdGlvbi10cmlhbmdsZVwiOiBcImYwNzFcIixcblx0XHRcdHBsYW5lOiBcImYwNzJcIixcblx0XHRcdGNhbGVuZGFyOiBcImYwNzNcIixcblx0XHRcdHJhbmRvbTogXCJmMDc0XCIsXG5cdFx0XHRjb21tZW50OiBcImYwNzVcIixcblx0XHRcdG1hZ25ldDogXCJmMDc2XCIsXG5cdFx0XHRcImNoZXZyb24tdXBcIjogXCJmMDc3XCIsXG5cdFx0XHRcImNoZXZyb24tZG93blwiOiBcImYwNzhcIixcblx0XHRcdHJldHdlZXQ6IFwiZjA3OVwiLFxuXHRcdFx0XCJzaG9wcGluZy1jYXJ0XCI6IFwiZjA3YVwiLFxuXHRcdFx0Zm9sZGVyOiBcImYwN2JcIixcblx0XHRcdFwiZm9sZGVyLW9wZW5cIjogXCJmMDdjXCIsXG5cdFx0XHRcImFycm93cy12XCI6IFwiZjA3ZFwiLFxuXHRcdFx0XCJhcnJvd3MtaFwiOiBcImYwN2VcIixcblx0XHRcdFwiYmFyLWNoYXJ0LW8sYmFyLWNoYXJ0XCI6IFwiZjA4MFwiLFxuXHRcdFx0XCJ0d2l0dGVyLXNxdWFyZVwiOiBcImYwODFcIixcblx0XHRcdFwiZmFjZWJvb2stc3F1YXJlXCI6IFwiZjA4MlwiLFxuXHRcdFx0XCJjYW1lcmEtcmV0cm9cIjogXCJmMDgzXCIsXG5cdFx0XHRrZXk6IFwiZjA4NFwiLFxuXHRcdFx0XCJnZWFycyxjb2dzXCI6IFwiZjA4NVwiLFxuXHRcdFx0Y29tbWVudHM6IFwiZjA4NlwiLFxuXHRcdFx0XCJ0aHVtYnMtby11cFwiOiBcImYwODdcIixcblx0XHRcdFwidGh1bWJzLW8tZG93blwiOiBcImYwODhcIixcblx0XHRcdFwic3Rhci1oYWxmXCI6IFwiZjA4OVwiLFxuXHRcdFx0XCJoZWFydC1vXCI6IFwiZjA4YVwiLFxuXHRcdFx0XCJzaWduLW91dFwiOiBcImYwOGJcIixcblx0XHRcdFwibGlua2VkaW4tc3F1YXJlXCI6IFwiZjA4Y1wiLFxuXHRcdFx0XCJ0aHVtYi10YWNrXCI6IFwiZjA4ZFwiLFxuXHRcdFx0XCJleHRlcm5hbC1saW5rXCI6IFwiZjA4ZVwiLFxuXHRcdFx0XCJzaWduLWluXCI6IFwiZjA5MFwiLFxuXHRcdFx0dHJvcGh5OiBcImYwOTFcIixcblx0XHRcdFwiZ2l0aHViLXNxdWFyZVwiOiBcImYwOTJcIixcblx0XHRcdHVwbG9hZDogXCJmMDkzXCIsXG5cdFx0XHRcImxlbW9uLW9cIjogXCJmMDk0XCIsXG5cdFx0XHRwaG9uZTogXCJmMDk1XCIsXG5cdFx0XHRcInNxdWFyZS1vXCI6IFwiZjA5NlwiLFxuXHRcdFx0XCJib29rbWFyay1vXCI6IFwiZjA5N1wiLFxuXHRcdFx0XCJwaG9uZS1zcXVhcmVcIjogXCJmMDk4XCIsXG5cdFx0XHR0d2l0dGVyOiBcImYwOTlcIixcblx0XHRcdFwiZmFjZWJvb2stZixmYWNlYm9va1wiOiBcImYwOWFcIixcblx0XHRcdGdpdGh1YjogXCJmMDliXCIsXG5cdFx0XHR1bmxvY2s6IFwiZjA5Y1wiLFxuXHRcdFx0XCJjcmVkaXQtY2FyZFwiOiBcImYwOWRcIixcblx0XHRcdFwiZmVlZCxyc3NcIjogXCJmMDllXCIsXG5cdFx0XHRcImhkZC1vXCI6IFwiZjBhMFwiLFxuXHRcdFx0YnVsbGhvcm46IFwiZjBhMVwiLFxuXHRcdFx0YmVsbDogXCJmMGYzXCIsXG5cdFx0XHRjZXJ0aWZpY2F0ZTogXCJmMGEzXCIsXG5cdFx0XHRcImhhbmQtby1yaWdodFwiOiBcImYwYTRcIixcblx0XHRcdFwiaGFuZC1vLWxlZnRcIjogXCJmMGE1XCIsXG5cdFx0XHRcImhhbmQtby11cFwiOiBcImYwYTZcIixcblx0XHRcdFwiaGFuZC1vLWRvd25cIjogXCJmMGE3XCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1sZWZ0XCI6IFwiZjBhOFwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtcmlnaHRcIjogXCJmMGE5XCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS11cFwiOiBcImYwYWFcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLWRvd25cIjogXCJmMGFiXCIsXG5cdFx0XHRnbG9iZTogXCJmMGFjXCIsXG5cdFx0XHR3cmVuY2g6IFwiZjBhZFwiLFxuXHRcdFx0dGFza3M6IFwiZjBhZVwiLFxuXHRcdFx0ZmlsdGVyOiBcImYwYjBcIixcblx0XHRcdGJyaWVmY2FzZTogXCJmMGIxXCIsXG5cdFx0XHRcImFycm93cy1hbHRcIjogXCJmMGIyXCIsXG5cdFx0XHRcImdyb3VwLHVzZXJzXCI6IFwiZjBjMFwiLFxuXHRcdFx0XCJjaGFpbixsaW5rXCI6IFwiZjBjMVwiLFxuXHRcdFx0Y2xvdWQ6IFwiZjBjMlwiLFxuXHRcdFx0Zmxhc2s6IFwiZjBjM1wiLFxuXHRcdFx0XCJjdXQsc2Npc3NvcnNcIjogXCJmMGM0XCIsXG5cdFx0XHRcImNvcHksZmlsZXMtb1wiOiBcImYwYzVcIixcblx0XHRcdHBhcGVyY2xpcDogXCJmMGM2XCIsXG5cdFx0XHRcInNhdmUsZmxvcHB5LW9cIjogXCJmMGM3XCIsXG5cdFx0XHRzcXVhcmU6IFwiZjBjOFwiLFxuXHRcdFx0XCJuYXZpY29uLHJlb3JkZXIsYmFyc1wiOiBcImYwYzlcIixcblx0XHRcdFwibGlzdC11bFwiOiBcImYwY2FcIixcblx0XHRcdFwibGlzdC1vbFwiOiBcImYwY2JcIixcblx0XHRcdHN0cmlrZXRocm91Z2g6IFwiZjBjY1wiLFxuXHRcdFx0dW5kZXJsaW5lOiBcImYwY2RcIixcblx0XHRcdHRhYmxlOiBcImYwY2VcIixcblx0XHRcdG1hZ2ljOiBcImYwZDBcIixcblx0XHRcdHRydWNrOiBcImYwZDFcIixcblx0XHRcdHBpbnRlcmVzdDogXCJmMGQyXCIsXG5cdFx0XHRcInBpbnRlcmVzdC1zcXVhcmVcIjogXCJmMGQzXCIsXG5cdFx0XHRcImdvb2dsZS1wbHVzLXNxdWFyZVwiOiBcImYwZDRcIixcblx0XHRcdFwiZ29vZ2xlLXBsdXNcIjogXCJmMGQ1XCIsXG5cdFx0XHRtb25leTogXCJmMGQ2XCIsXG5cdFx0XHRcImNhcmV0LWRvd25cIjogXCJmMGQ3XCIsXG5cdFx0XHRcImNhcmV0LXVwXCI6IFwiZjBkOFwiLFxuXHRcdFx0XCJjYXJldC1sZWZ0XCI6IFwiZjBkOVwiLFxuXHRcdFx0XCJjYXJldC1yaWdodFwiOiBcImYwZGFcIixcblx0XHRcdGNvbHVtbnM6IFwiZjBkYlwiLFxuXHRcdFx0XCJ1bnNvcnRlZCxzb3J0XCI6IFwiZjBkY1wiLFxuXHRcdFx0XCJzb3J0LWRvd24sc29ydC1kZXNjXCI6IFwiZjBkZFwiLFxuXHRcdFx0XCJzb3J0LXVwLHNvcnQtYXNjXCI6IFwiZjBkZVwiLFxuXHRcdFx0ZW52ZWxvcGU6IFwiZjBlMFwiLFxuXHRcdFx0bGlua2VkaW46IFwiZjBlMVwiLFxuXHRcdFx0XCJyb3RhdGUtbGVmdCx1bmRvXCI6IFwiZjBlMlwiLFxuXHRcdFx0XCJsZWdhbCxnYXZlbFwiOiBcImYwZTNcIixcblx0XHRcdFwiZGFzaGJvYXJkLHRhY2hvbWV0ZXJcIjogXCJmMGU0XCIsXG5cdFx0XHRcImNvbW1lbnQtb1wiOiBcImYwZTVcIixcblx0XHRcdFwiY29tbWVudHMtb1wiOiBcImYwZTZcIixcblx0XHRcdFwiZmxhc2gsYm9sdFwiOiBcImYwZTdcIixcblx0XHRcdHNpdGVtYXA6IFwiZjBlOFwiLFxuXHRcdFx0dW1icmVsbGE6IFwiZjBlOVwiLFxuXHRcdFx0XCJwYXN0ZSxjbGlwYm9hcmRcIjogXCJmMGVhXCIsXG5cdFx0XHRcImxpZ2h0YnVsYi1vXCI6IFwiZjBlYlwiLFxuXHRcdFx0ZXhjaGFuZ2U6IFwiZjBlY1wiLFxuXHRcdFx0XCJjbG91ZC1kb3dubG9hZFwiOiBcImYwZWRcIixcblx0XHRcdFwiY2xvdWQtdXBsb2FkXCI6IFwiZjBlZVwiLFxuXHRcdFx0XCJ1c2VyLW1kXCI6IFwiZjBmMFwiLFxuXHRcdFx0c3RldGhvc2NvcGU6IFwiZjBmMVwiLFxuXHRcdFx0c3VpdGNhc2U6IFwiZjBmMlwiLFxuXHRcdFx0XCJiZWxsLW9cIjogXCJmMGEyXCIsXG5cdFx0XHRjb2ZmZWU6IFwiZjBmNFwiLFxuXHRcdFx0Y3V0bGVyeTogXCJmMGY1XCIsXG5cdFx0XHRcImZpbGUtdGV4dC1vXCI6IFwiZjBmNlwiLFxuXHRcdFx0XCJidWlsZGluZy1vXCI6IFwiZjBmN1wiLFxuXHRcdFx0XCJob3NwaXRhbC1vXCI6IFwiZjBmOFwiLFxuXHRcdFx0YW1idWxhbmNlOiBcImYwZjlcIixcblx0XHRcdG1lZGtpdDogXCJmMGZhXCIsXG5cdFx0XHRcImZpZ2h0ZXItamV0XCI6IFwiZjBmYlwiLFxuXHRcdFx0YmVlcjogXCJmMGZjXCIsXG5cdFx0XHRcImgtc3F1YXJlXCI6IFwiZjBmZFwiLFxuXHRcdFx0XCJwbHVzLXNxdWFyZVwiOiBcImYwZmVcIixcblx0XHRcdFwiYW5nbGUtZG91YmxlLWxlZnRcIjogXCJmMTAwXCIsXG5cdFx0XHRcImFuZ2xlLWRvdWJsZS1yaWdodFwiOiBcImYxMDFcIixcblx0XHRcdFwiYW5nbGUtZG91YmxlLXVwXCI6IFwiZjEwMlwiLFxuXHRcdFx0XCJhbmdsZS1kb3VibGUtZG93blwiOiBcImYxMDNcIixcblx0XHRcdFwiYW5nbGUtbGVmdFwiOiBcImYxMDRcIixcblx0XHRcdFwiYW5nbGUtcmlnaHRcIjogXCJmMTA1XCIsXG5cdFx0XHRcImFuZ2xlLXVwXCI6IFwiZjEwNlwiLFxuXHRcdFx0XCJhbmdsZS1kb3duXCI6IFwiZjEwN1wiLFxuXHRcdFx0ZGVza3RvcDogXCJmMTA4XCIsXG5cdFx0XHRsYXB0b3A6IFwiZjEwOVwiLFxuXHRcdFx0dGFibGV0OiBcImYxMGFcIixcblx0XHRcdFwibW9iaWxlLXBob25lLG1vYmlsZVwiOiBcImYxMGJcIixcblx0XHRcdFwiY2lyY2xlLW9cIjogXCJmMTBjXCIsXG5cdFx0XHRcInF1b3RlLWxlZnRcIjogXCJmMTBkXCIsXG5cdFx0XHRcInF1b3RlLXJpZ2h0XCI6IFwiZjEwZVwiLFxuXHRcdFx0c3Bpbm5lcjogXCJmMTEwXCIsXG5cdFx0XHRjaXJjbGU6IFwiZjExMVwiLFxuXHRcdFx0XCJtYWlsLXJlcGx5LHJlcGx5XCI6IFwiZjExMlwiLFxuXHRcdFx0XCJnaXRodWItYWx0XCI6IFwiZjExM1wiLFxuXHRcdFx0XCJmb2xkZXItb1wiOiBcImYxMTRcIixcblx0XHRcdFwiZm9sZGVyLW9wZW4tb1wiOiBcImYxMTVcIixcblx0XHRcdFwic21pbGUtb1wiOiBcImYxMThcIixcblx0XHRcdFwiZnJvd24tb1wiOiBcImYxMTlcIixcblx0XHRcdFwibWVoLW9cIjogXCJmMTFhXCIsXG5cdFx0XHRnYW1lcGFkOiBcImYxMWJcIixcblx0XHRcdFwia2V5Ym9hcmQtb1wiOiBcImYxMWNcIixcblx0XHRcdFwiZmxhZy1vXCI6IFwiZjExZFwiLFxuXHRcdFx0XCJmbGFnLWNoZWNrZXJlZFwiOiBcImYxMWVcIixcblx0XHRcdHRlcm1pbmFsOiBcImYxMjBcIixcblx0XHRcdGNvZGU6IFwiZjEyMVwiLFxuXHRcdFx0XCJtYWlsLXJlcGx5LWFsbCxyZXBseS1hbGxcIjogXCJmMTIyXCIsXG5cdFx0XHRcInN0YXItaGFsZi1lbXB0eSxzdGFyLWhhbGYtZnVsbCxzdGFyLWhhbGYtb1wiOiBcImYxMjNcIixcblx0XHRcdFwibG9jYXRpb24tYXJyb3dcIjogXCJmMTI0XCIsXG5cdFx0XHRjcm9wOiBcImYxMjVcIixcblx0XHRcdFwiY29kZS1mb3JrXCI6IFwiZjEyNlwiLFxuXHRcdFx0XCJ1bmxpbmssY2hhaW4tYnJva2VuXCI6IFwiZjEyN1wiLFxuXHRcdFx0cXVlc3Rpb246IFwiZjEyOFwiLFxuXHRcdFx0aW5mbzogXCJmMTI5XCIsXG5cdFx0XHRleGNsYW1hdGlvbjogXCJmMTJhXCIsXG5cdFx0XHRzdXBlcnNjcmlwdDogXCJmMTJiXCIsXG5cdFx0XHRzdWJzY3JpcHQ6IFwiZjEyY1wiLFxuXHRcdFx0ZXJhc2VyOiBcImYxMmRcIixcblx0XHRcdFwicHV6emxlLXBpZWNlXCI6IFwiZjEyZVwiLFxuXHRcdFx0bWljcm9waG9uZTogXCJmMTMwXCIsXG5cdFx0XHRcIm1pY3JvcGhvbmUtc2xhc2hcIjogXCJmMTMxXCIsXG5cdFx0XHRzaGllbGQ6IFwiZjEzMlwiLFxuXHRcdFx0XCJjYWxlbmRhci1vXCI6IFwiZjEzM1wiLFxuXHRcdFx0XCJmaXJlLWV4dGluZ3Vpc2hlclwiOiBcImYxMzRcIixcblx0XHRcdHJvY2tldDogXCJmMTM1XCIsXG5cdFx0XHRtYXhjZG46IFwiZjEzNlwiLFxuXHRcdFx0XCJjaGV2cm9uLWNpcmNsZS1sZWZ0XCI6IFwiZjEzN1wiLFxuXHRcdFx0XCJjaGV2cm9uLWNpcmNsZS1yaWdodFwiOiBcImYxMzhcIixcblx0XHRcdFwiY2hldnJvbi1jaXJjbGUtdXBcIjogXCJmMTM5XCIsXG5cdFx0XHRcImNoZXZyb24tY2lyY2xlLWRvd25cIjogXCJmMTNhXCIsXG5cdFx0XHRodG1sNTogXCJmMTNiXCIsXG5cdFx0XHRjc3MzOiBcImYxM2NcIixcblx0XHRcdGFuY2hvcjogXCJmMTNkXCIsXG5cdFx0XHRcInVubG9jay1hbHRcIjogXCJmMTNlXCIsXG5cdFx0XHRidWxsc2V5ZTogXCJmMTQwXCIsXG5cdFx0XHRcImVsbGlwc2lzLWhcIjogXCJmMTQxXCIsXG5cdFx0XHRcImVsbGlwc2lzLXZcIjogXCJmMTQyXCIsXG5cdFx0XHRcInJzcy1zcXVhcmVcIjogXCJmMTQzXCIsXG5cdFx0XHRcInBsYXktY2lyY2xlXCI6IFwiZjE0NFwiLFxuXHRcdFx0dGlja2V0OiBcImYxNDVcIixcblx0XHRcdFwibWludXMtc3F1YXJlXCI6IFwiZjE0NlwiLFxuXHRcdFx0XCJtaW51cy1zcXVhcmUtb1wiOiBcImYxNDdcIixcblx0XHRcdFwibGV2ZWwtdXBcIjogXCJmMTQ4XCIsXG5cdFx0XHRcImxldmVsLWRvd25cIjogXCJmMTQ5XCIsXG5cdFx0XHRcImNoZWNrLXNxdWFyZVwiOiBcImYxNGFcIixcblx0XHRcdFwicGVuY2lsLXNxdWFyZVwiOiBcImYxNGJcIixcblx0XHRcdFwiZXh0ZXJuYWwtbGluay1zcXVhcmVcIjogXCJmMTRjXCIsXG5cdFx0XHRcInNoYXJlLXNxdWFyZVwiOiBcImYxNGRcIixcblx0XHRcdGNvbXBhc3M6IFwiZjE0ZVwiLFxuXHRcdFx0XCJ0b2dnbGUtZG93bixjYXJldC1zcXVhcmUtby1kb3duXCI6IFwiZjE1MFwiLFxuXHRcdFx0XCJ0b2dnbGUtdXAsY2FyZXQtc3F1YXJlLW8tdXBcIjogXCJmMTUxXCIsXG5cdFx0XHRcInRvZ2dsZS1yaWdodCxjYXJldC1zcXVhcmUtby1yaWdodFwiOiBcImYxNTJcIixcblx0XHRcdFwiZXVybyxldXJcIjogXCJmMTUzXCIsXG5cdFx0XHRnYnA6IFwiZjE1NFwiLFxuXHRcdFx0XCJkb2xsYXIsdXNkXCI6IFwiZjE1NVwiLFxuXHRcdFx0XCJydXBlZSxpbnJcIjogXCJmMTU2XCIsXG5cdFx0XHRcImNueSxybWIseWVuLGpweVwiOiBcImYxNTdcIixcblx0XHRcdFwicnVibGUscm91YmxlLHJ1YlwiOiBcImYxNThcIixcblx0XHRcdFwid29uLGtyd1wiOiBcImYxNTlcIixcblx0XHRcdFwiYml0Y29pbixidGNcIjogXCJmMTVhXCIsXG5cdFx0XHRmaWxlOiBcImYxNWJcIixcblx0XHRcdFwiZmlsZS10ZXh0XCI6IFwiZjE1Y1wiLFxuXHRcdFx0XCJzb3J0LWFscGhhLWFzY1wiOiBcImYxNWRcIixcblx0XHRcdFwic29ydC1hbHBoYS1kZXNjXCI6IFwiZjE1ZVwiLFxuXHRcdFx0XCJzb3J0LWFtb3VudC1hc2NcIjogXCJmMTYwXCIsXG5cdFx0XHRcInNvcnQtYW1vdW50LWRlc2NcIjogXCJmMTYxXCIsXG5cdFx0XHRcInNvcnQtbnVtZXJpYy1hc2NcIjogXCJmMTYyXCIsXG5cdFx0XHRcInNvcnQtbnVtZXJpYy1kZXNjXCI6IFwiZjE2M1wiLFxuXHRcdFx0XCJ0aHVtYnMtdXBcIjogXCJmMTY0XCIsXG5cdFx0XHRcInRodW1icy1kb3duXCI6IFwiZjE2NVwiLFxuXHRcdFx0XCJ5b3V0dWJlLXNxdWFyZVwiOiBcImYxNjZcIixcblx0XHRcdHlvdXR1YmU6IFwiZjE2N1wiLFxuXHRcdFx0eGluZzogXCJmMTY4XCIsXG5cdFx0XHRcInhpbmctc3F1YXJlXCI6IFwiZjE2OVwiLFxuXHRcdFx0XCJ5b3V0dWJlLXBsYXlcIjogXCJmMTZhXCIsXG5cdFx0XHRkcm9wYm94OiBcImYxNmJcIixcblx0XHRcdFwic3RhY2stb3ZlcmZsb3dcIjogXCJmMTZjXCIsXG5cdFx0XHRpbnN0YWdyYW06IFwiZjE2ZFwiLFxuXHRcdFx0ZmxpY2tyOiBcImYxNmVcIixcblx0XHRcdGFkbjogXCJmMTcwXCIsXG5cdFx0XHRiaXRidWNrZXQ6IFwiZjE3MVwiLFxuXHRcdFx0XCJiaXRidWNrZXQtc3F1YXJlXCI6IFwiZjE3MlwiLFxuXHRcdFx0dHVtYmxyOiBcImYxNzNcIixcblx0XHRcdFwidHVtYmxyLXNxdWFyZVwiOiBcImYxNzRcIixcblx0XHRcdFwibG9uZy1hcnJvdy1kb3duXCI6IFwiZjE3NVwiLFxuXHRcdFx0XCJsb25nLWFycm93LXVwXCI6IFwiZjE3NlwiLFxuXHRcdFx0XCJsb25nLWFycm93LWxlZnRcIjogXCJmMTc3XCIsXG5cdFx0XHRcImxvbmctYXJyb3ctcmlnaHRcIjogXCJmMTc4XCIsXG5cdFx0XHRhcHBsZTogXCJmMTc5XCIsXG5cdFx0XHR3aW5kb3dzOiBcImYxN2FcIixcblx0XHRcdGFuZHJvaWQ6IFwiZjE3YlwiLFxuXHRcdFx0bGludXg6IFwiZjE3Y1wiLFxuXHRcdFx0ZHJpYmJibGU6IFwiZjE3ZFwiLFxuXHRcdFx0c2t5cGU6IFwiZjE3ZVwiLFxuXHRcdFx0Zm91cnNxdWFyZTogXCJmMTgwXCIsXG5cdFx0XHR0cmVsbG86IFwiZjE4MVwiLFxuXHRcdFx0ZmVtYWxlOiBcImYxODJcIixcblx0XHRcdG1hbGU6IFwiZjE4M1wiLFxuXHRcdFx0XCJnaXR0aXAsZ3JhdGlwYXlcIjogXCJmMTg0XCIsXG5cdFx0XHRcInN1bi1vXCI6IFwiZjE4NVwiLFxuXHRcdFx0XCJtb29uLW9cIjogXCJmMTg2XCIsXG5cdFx0XHRhcmNoaXZlOiBcImYxODdcIixcblx0XHRcdGJ1ZzogXCJmMTg4XCIsXG5cdFx0XHR2azogXCJmMTg5XCIsXG5cdFx0XHR3ZWlibzogXCJmMThhXCIsXG5cdFx0XHRyZW5yZW46IFwiZjE4YlwiLFxuXHRcdFx0cGFnZWxpbmVzOiBcImYxOGNcIixcblx0XHRcdFwic3RhY2stZXhjaGFuZ2VcIjogXCJmMThkXCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1vLXJpZ2h0XCI6IFwiZjE4ZVwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtby1sZWZ0XCI6IFwiZjE5MFwiLFxuXHRcdFx0XCJ0b2dnbGUtbGVmdCxjYXJldC1zcXVhcmUtby1sZWZ0XCI6IFwiZjE5MVwiLFxuXHRcdFx0XCJkb3QtY2lyY2xlLW9cIjogXCJmMTkyXCIsXG5cdFx0XHR3aGVlbGNoYWlyOiBcImYxOTNcIixcblx0XHRcdFwidmltZW8tc3F1YXJlXCI6IFwiZjE5NFwiLFxuXHRcdFx0XCJ0dXJraXNoLWxpcmEsdHJ5XCI6IFwiZjE5NVwiLFxuXHRcdFx0XCJwbHVzLXNxdWFyZS1vXCI6IFwiZjE5NlwiLFxuXHRcdFx0XCJzcGFjZS1zaHV0dGxlXCI6IFwiZjE5N1wiLFxuXHRcdFx0c2xhY2s6IFwiZjE5OFwiLFxuXHRcdFx0XCJlbnZlbG9wZS1zcXVhcmVcIjogXCJmMTk5XCIsXG5cdFx0XHR3b3JkcHJlc3M6IFwiZjE5YVwiLFxuXHRcdFx0b3BlbmlkOiBcImYxOWJcIixcblx0XHRcdFwiaW5zdGl0dXRpb24sYmFuayx1bml2ZXJzaXR5XCI6IFwiZjE5Y1wiLFxuXHRcdFx0XCJtb3J0YXItYm9hcmQsZ3JhZHVhdGlvbi1jYXBcIjogXCJmMTlkXCIsXG5cdFx0XHR5YWhvbzogXCJmMTllXCIsXG5cdFx0XHRnb29nbGU6IFwiZjFhMFwiLFxuXHRcdFx0cmVkZGl0OiBcImYxYTFcIixcblx0XHRcdFwicmVkZGl0LXNxdWFyZVwiOiBcImYxYTJcIixcblx0XHRcdFwic3R1bWJsZXVwb24tY2lyY2xlXCI6IFwiZjFhM1wiLFxuXHRcdFx0c3R1bWJsZXVwb246IFwiZjFhNFwiLFxuXHRcdFx0ZGVsaWNpb3VzOiBcImYxYTVcIixcblx0XHRcdGRpZ2c6IFwiZjFhNlwiLFxuXHRcdFx0XCJwaWVkLXBpcGVyLXBwXCI6IFwiZjFhN1wiLFxuXHRcdFx0XCJwaWVkLXBpcGVyLWFsdFwiOiBcImYxYThcIixcblx0XHRcdGRydXBhbDogXCJmMWE5XCIsXG5cdFx0XHRqb29tbGE6IFwiZjFhYVwiLFxuXHRcdFx0bGFuZ3VhZ2U6IFwiZjFhYlwiLFxuXHRcdFx0ZmF4OiBcImYxYWNcIixcblx0XHRcdGJ1aWxkaW5nOiBcImYxYWRcIixcblx0XHRcdGNoaWxkOiBcImYxYWVcIixcblx0XHRcdHBhdzogXCJmMWIwXCIsXG5cdFx0XHRzcG9vbjogXCJmMWIxXCIsXG5cdFx0XHRjdWJlOiBcImYxYjJcIixcblx0XHRcdGN1YmVzOiBcImYxYjNcIixcblx0XHRcdGJlaGFuY2U6IFwiZjFiNFwiLFxuXHRcdFx0XCJiZWhhbmNlLXNxdWFyZVwiOiBcImYxYjVcIixcblx0XHRcdHN0ZWFtOiBcImYxYjZcIixcblx0XHRcdFwic3RlYW0tc3F1YXJlXCI6IFwiZjFiN1wiLFxuXHRcdFx0cmVjeWNsZTogXCJmMWI4XCIsXG5cdFx0XHRcImF1dG9tb2JpbGUsY2FyXCI6IFwiZjFiOVwiLFxuXHRcdFx0XCJjYWIsdGF4aVwiOiBcImYxYmFcIixcblx0XHRcdHRyZWU6IFwiZjFiYlwiLFxuXHRcdFx0c3BvdGlmeTogXCJmMWJjXCIsXG5cdFx0XHRkZXZpYW50YXJ0OiBcImYxYmRcIixcblx0XHRcdHNvdW5kY2xvdWQ6IFwiZjFiZVwiLFxuXHRcdFx0ZGF0YWJhc2U6IFwiZjFjMFwiLFxuXHRcdFx0XCJmaWxlLXBkZi1vXCI6IFwiZjFjMVwiLFxuXHRcdFx0XCJmaWxlLXdvcmQtb1wiOiBcImYxYzJcIixcblx0XHRcdFwiZmlsZS1leGNlbC1vXCI6IFwiZjFjM1wiLFxuXHRcdFx0XCJmaWxlLXBvd2VycG9pbnQtb1wiOiBcImYxYzRcIixcblx0XHRcdFwiZmlsZS1waG90by1vLGZpbGUtcGljdHVyZS1vLGZpbGUtaW1hZ2Utb1wiOiBcImYxYzVcIixcblx0XHRcdFwiZmlsZS16aXAtbyxmaWxlLWFyY2hpdmUtb1wiOiBcImYxYzZcIixcblx0XHRcdFwiZmlsZS1zb3VuZC1vLGZpbGUtYXVkaW8tb1wiOiBcImYxYzdcIixcblx0XHRcdFwiZmlsZS1tb3ZpZS1vLGZpbGUtdmlkZW8tb1wiOiBcImYxYzhcIixcblx0XHRcdFwiZmlsZS1jb2RlLW9cIjogXCJmMWM5XCIsXG5cdFx0XHR2aW5lOiBcImYxY2FcIixcblx0XHRcdGNvZGVwZW46IFwiZjFjYlwiLFxuXHRcdFx0anNmaWRkbGU6IFwiZjFjY1wiLFxuXHRcdFx0XCJsaWZlLWJvdXksbGlmZS1idW95LGxpZmUtc2F2ZXIsc3VwcG9ydCxsaWZlLXJpbmdcIjogXCJmMWNkXCIsXG5cdFx0XHRcImNpcmNsZS1vLW5vdGNoXCI6IFwiZjFjZVwiLFxuXHRcdFx0XCJyYSxyZXNpc3RhbmNlLHJlYmVsXCI6IFwiZjFkMFwiLFxuXHRcdFx0XCJnZSxlbXBpcmVcIjogXCJmMWQxXCIsXG5cdFx0XHRcImdpdC1zcXVhcmVcIjogXCJmMWQyXCIsXG5cdFx0XHRnaXQ6IFwiZjFkM1wiLFxuXHRcdFx0XCJ5LWNvbWJpbmF0b3Itc3F1YXJlLHljLXNxdWFyZSxoYWNrZXItbmV3c1wiOiBcImYxZDRcIixcblx0XHRcdFwidGVuY2VudC13ZWlib1wiOiBcImYxZDVcIixcblx0XHRcdHFxOiBcImYxZDZcIixcblx0XHRcdFwid2VjaGF0LHdlaXhpblwiOiBcImYxZDdcIixcblx0XHRcdFwic2VuZCxwYXBlci1wbGFuZVwiOiBcImYxZDhcIixcblx0XHRcdFwic2VuZC1vLHBhcGVyLXBsYW5lLW9cIjogXCJmMWQ5XCIsXG5cdFx0XHRoaXN0b3J5OiBcImYxZGFcIixcblx0XHRcdFwiY2lyY2xlLXRoaW5cIjogXCJmMWRiXCIsXG5cdFx0XHRoZWFkZXI6IFwiZjFkY1wiLFxuXHRcdFx0cGFyYWdyYXBoOiBcImYxZGRcIixcblx0XHRcdHNsaWRlcnM6IFwiZjFkZVwiLFxuXHRcdFx0XCJzaGFyZS1hbHRcIjogXCJmMWUwXCIsXG5cdFx0XHRcInNoYXJlLWFsdC1zcXVhcmVcIjogXCJmMWUxXCIsXG5cdFx0XHRib21iOiBcImYxZTJcIixcblx0XHRcdFwic29jY2VyLWJhbGwtbyxmdXRib2wtb1wiOiBcImYxZTNcIixcblx0XHRcdHR0eTogXCJmMWU0XCIsXG5cdFx0XHRiaW5vY3VsYXJzOiBcImYxZTVcIixcblx0XHRcdHBsdWc6IFwiZjFlNlwiLFxuXHRcdFx0c2xpZGVzaGFyZTogXCJmMWU3XCIsXG5cdFx0XHR0d2l0Y2g6IFwiZjFlOFwiLFxuXHRcdFx0eWVscDogXCJmMWU5XCIsXG5cdFx0XHRcIm5ld3NwYXBlci1vXCI6IFwiZjFlYVwiLFxuXHRcdFx0d2lmaTogXCJmMWViXCIsXG5cdFx0XHRjYWxjdWxhdG9yOiBcImYxZWNcIixcblx0XHRcdHBheXBhbDogXCJmMWVkXCIsXG5cdFx0XHRcImdvb2dsZS13YWxsZXRcIjogXCJmMWVlXCIsXG5cdFx0XHRcImNjLXZpc2FcIjogXCJmMWYwXCIsXG5cdFx0XHRcImNjLW1hc3RlcmNhcmRcIjogXCJmMWYxXCIsXG5cdFx0XHRcImNjLWRpc2NvdmVyXCI6IFwiZjFmMlwiLFxuXHRcdFx0XCJjYy1hbWV4XCI6IFwiZjFmM1wiLFxuXHRcdFx0XCJjYy1wYXlwYWxcIjogXCJmMWY0XCIsXG5cdFx0XHRcImNjLXN0cmlwZVwiOiBcImYxZjVcIixcblx0XHRcdFwiYmVsbC1zbGFzaFwiOiBcImYxZjZcIixcblx0XHRcdFwiYmVsbC1zbGFzaC1vXCI6IFwiZjFmN1wiLFxuXHRcdFx0dHJhc2g6IFwiZjFmOFwiLFxuXHRcdFx0Y29weXJpZ2h0OiBcImYxZjlcIixcblx0XHRcdGF0OiBcImYxZmFcIixcblx0XHRcdGV5ZWRyb3BwZXI6IFwiZjFmYlwiLFxuXHRcdFx0XCJwYWludC1icnVzaFwiOiBcImYxZmNcIixcblx0XHRcdFwiYmlydGhkYXktY2FrZVwiOiBcImYxZmRcIixcblx0XHRcdFwiYXJlYS1jaGFydFwiOiBcImYxZmVcIixcblx0XHRcdFwicGllLWNoYXJ0XCI6IFwiZjIwMFwiLFxuXHRcdFx0XCJsaW5lLWNoYXJ0XCI6IFwiZjIwMVwiLFxuXHRcdFx0bGFzdGZtOiBcImYyMDJcIixcblx0XHRcdFwibGFzdGZtLXNxdWFyZVwiOiBcImYyMDNcIixcblx0XHRcdFwidG9nZ2xlLW9mZlwiOiBcImYyMDRcIixcblx0XHRcdFwidG9nZ2xlLW9uXCI6IFwiZjIwNVwiLFxuXHRcdFx0YmljeWNsZTogXCJmMjA2XCIsXG5cdFx0XHRidXM6IFwiZjIwN1wiLFxuXHRcdFx0aW94aG9zdDogXCJmMjA4XCIsXG5cdFx0XHRhbmdlbGxpc3Q6IFwiZjIwOVwiLFxuXHRcdFx0Y2M6IFwiZjIwYVwiLFxuXHRcdFx0XCJzaGVrZWwsc2hlcWVsLGlsc1wiOiBcImYyMGJcIixcblx0XHRcdG1lYW5wYXRoOiBcImYyMGNcIixcblx0XHRcdGJ1eXNlbGxhZHM6IFwiZjIwZFwiLFxuXHRcdFx0Y29ubmVjdGRldmVsb3A6IFwiZjIwZVwiLFxuXHRcdFx0ZGFzaGN1YmU6IFwiZjIxMFwiLFxuXHRcdFx0Zm9ydW1iZWU6IFwiZjIxMVwiLFxuXHRcdFx0bGVhbnB1YjogXCJmMjEyXCIsXG5cdFx0XHRzZWxsc3k6IFwiZjIxM1wiLFxuXHRcdFx0c2hpcnRzaW5idWxrOiBcImYyMTRcIixcblx0XHRcdHNpbXBseWJ1aWx0OiBcImYyMTVcIixcblx0XHRcdHNreWF0bGFzOiBcImYyMTZcIixcblx0XHRcdFwiY2FydC1wbHVzXCI6IFwiZjIxN1wiLFxuXHRcdFx0XCJjYXJ0LWFycm93LWRvd25cIjogXCJmMjE4XCIsXG5cdFx0XHRkaWFtb25kOiBcImYyMTlcIixcblx0XHRcdHNoaXA6IFwiZjIxYVwiLFxuXHRcdFx0XCJ1c2VyLXNlY3JldFwiOiBcImYyMWJcIixcblx0XHRcdG1vdG9yY3ljbGU6IFwiZjIxY1wiLFxuXHRcdFx0XCJzdHJlZXQtdmlld1wiOiBcImYyMWRcIixcblx0XHRcdGhlYXJ0YmVhdDogXCJmMjFlXCIsXG5cdFx0XHR2ZW51czogXCJmMjIxXCIsXG5cdFx0XHRtYXJzOiBcImYyMjJcIixcblx0XHRcdG1lcmN1cnk6IFwiZjIyM1wiLFxuXHRcdFx0XCJpbnRlcnNleCx0cmFuc2dlbmRlclwiOiBcImYyMjRcIixcblx0XHRcdFwidHJhbnNnZW5kZXItYWx0XCI6IFwiZjIyNVwiLFxuXHRcdFx0XCJ2ZW51cy1kb3VibGVcIjogXCJmMjI2XCIsXG5cdFx0XHRcIm1hcnMtZG91YmxlXCI6IFwiZjIyN1wiLFxuXHRcdFx0XCJ2ZW51cy1tYXJzXCI6IFwiZjIyOFwiLFxuXHRcdFx0XCJtYXJzLXN0cm9rZVwiOiBcImYyMjlcIixcblx0XHRcdFwibWFycy1zdHJva2UtdlwiOiBcImYyMmFcIixcblx0XHRcdFwibWFycy1zdHJva2UtaFwiOiBcImYyMmJcIixcblx0XHRcdG5ldXRlcjogXCJmMjJjXCIsXG5cdFx0XHRnZW5kZXJsZXNzOiBcImYyMmRcIixcblx0XHRcdFwiZmFjZWJvb2stb2ZmaWNpYWxcIjogXCJmMjMwXCIsXG5cdFx0XHRcInBpbnRlcmVzdC1wXCI6IFwiZjIzMVwiLFxuXHRcdFx0d2hhdHNhcHA6IFwiZjIzMlwiLFxuXHRcdFx0c2VydmVyOiBcImYyMzNcIixcblx0XHRcdFwidXNlci1wbHVzXCI6IFwiZjIzNFwiLFxuXHRcdFx0XCJ1c2VyLXRpbWVzXCI6IFwiZjIzNVwiLFxuXHRcdFx0XCJob3RlbCxiZWRcIjogXCJmMjM2XCIsXG5cdFx0XHR2aWFjb2luOiBcImYyMzdcIixcblx0XHRcdHRyYWluOiBcImYyMzhcIixcblx0XHRcdHN1YndheTogXCJmMjM5XCIsXG5cdFx0XHRtZWRpdW06IFwiZjIzYVwiLFxuXHRcdFx0XCJ5Yyx5LWNvbWJpbmF0b3JcIjogXCJmMjNiXCIsXG5cdFx0XHRcIm9wdGluLW1vbnN0ZXJcIjogXCJmMjNjXCIsXG5cdFx0XHRvcGVuY2FydDogXCJmMjNkXCIsXG5cdFx0XHRleHBlZGl0ZWRzc2w6IFwiZjIzZVwiLFxuXHRcdFx0XCJiYXR0ZXJ5LTQsYmF0dGVyeS1mdWxsXCI6IFwiZjI0MFwiLFxuXHRcdFx0XCJiYXR0ZXJ5LTMsYmF0dGVyeS10aHJlZS1xdWFydGVyc1wiOiBcImYyNDFcIixcblx0XHRcdFwiYmF0dGVyeS0yLGJhdHRlcnktaGFsZlwiOiBcImYyNDJcIixcblx0XHRcdFwiYmF0dGVyeS0xLGJhdHRlcnktcXVhcnRlclwiOiBcImYyNDNcIixcblx0XHRcdFwiYmF0dGVyeS0wLGJhdHRlcnktZW1wdHlcIjogXCJmMjQ0XCIsXG5cdFx0XHRcIm1vdXNlLXBvaW50ZXJcIjogXCJmMjQ1XCIsXG5cdFx0XHRcImktY3Vyc29yXCI6IFwiZjI0NlwiLFxuXHRcdFx0XCJvYmplY3QtZ3JvdXBcIjogXCJmMjQ3XCIsXG5cdFx0XHRcIm9iamVjdC11bmdyb3VwXCI6IFwiZjI0OFwiLFxuXHRcdFx0XCJzdGlja3ktbm90ZVwiOiBcImYyNDlcIixcblx0XHRcdFwic3RpY2t5LW5vdGUtb1wiOiBcImYyNGFcIixcblx0XHRcdFwiY2MtamNiXCI6IFwiZjI0YlwiLFxuXHRcdFx0XCJjYy1kaW5lcnMtY2x1YlwiOiBcImYyNGNcIixcblx0XHRcdGNsb25lOiBcImYyNGRcIixcblx0XHRcdFwiYmFsYW5jZS1zY2FsZVwiOiBcImYyNGVcIixcblx0XHRcdFwiaG91cmdsYXNzLW9cIjogXCJmMjUwXCIsXG5cdFx0XHRcImhvdXJnbGFzcy0xLGhvdXJnbGFzcy1zdGFydFwiOiBcImYyNTFcIixcblx0XHRcdFwiaG91cmdsYXNzLTIsaG91cmdsYXNzLWhhbGZcIjogXCJmMjUyXCIsXG5cdFx0XHRcImhvdXJnbGFzcy0zLGhvdXJnbGFzcy1lbmRcIjogXCJmMjUzXCIsXG5cdFx0XHRob3VyZ2xhc3M6IFwiZjI1NFwiLFxuXHRcdFx0XCJoYW5kLWdyYWItbyxoYW5kLXJvY2stb1wiOiBcImYyNTVcIixcblx0XHRcdFwiaGFuZC1zdG9wLW8saGFuZC1wYXBlci1vXCI6IFwiZjI1NlwiLFxuXHRcdFx0XCJoYW5kLXNjaXNzb3JzLW9cIjogXCJmMjU3XCIsXG5cdFx0XHRcImhhbmQtbGl6YXJkLW9cIjogXCJmMjU4XCIsXG5cdFx0XHRcImhhbmQtc3BvY2stb1wiOiBcImYyNTlcIixcblx0XHRcdFwiaGFuZC1wb2ludGVyLW9cIjogXCJmMjVhXCIsXG5cdFx0XHRcImhhbmQtcGVhY2Utb1wiOiBcImYyNWJcIixcblx0XHRcdHRyYWRlbWFyazogXCJmMjVjXCIsXG5cdFx0XHRyZWdpc3RlcmVkOiBcImYyNWRcIixcblx0XHRcdFwiY3JlYXRpdmUtY29tbW9uc1wiOiBcImYyNWVcIixcblx0XHRcdGdnOiBcImYyNjBcIixcblx0XHRcdFwiZ2ctY2lyY2xlXCI6IFwiZjI2MVwiLFxuXHRcdFx0dHJpcGFkdmlzb3I6IFwiZjI2MlwiLFxuXHRcdFx0b2Rub2tsYXNzbmlraTogXCJmMjYzXCIsXG5cdFx0XHRcIm9kbm9rbGFzc25pa2ktc3F1YXJlXCI6IFwiZjI2NFwiLFxuXHRcdFx0XCJnZXQtcG9ja2V0XCI6IFwiZjI2NVwiLFxuXHRcdFx0XCJ3aWtpcGVkaWEtd1wiOiBcImYyNjZcIixcblx0XHRcdHNhZmFyaTogXCJmMjY3XCIsXG5cdFx0XHRjaHJvbWU6IFwiZjI2OFwiLFxuXHRcdFx0ZmlyZWZveDogXCJmMjY5XCIsXG5cdFx0XHRvcGVyYTogXCJmMjZhXCIsXG5cdFx0XHRcImludGVybmV0LWV4cGxvcmVyXCI6IFwiZjI2YlwiLFxuXHRcdFx0XCJ0dix0ZWxldmlzaW9uXCI6IFwiZjI2Y1wiLFxuXHRcdFx0Y29udGFvOiBcImYyNmRcIixcblx0XHRcdFwiNTAwcHhcIjogXCJmMjZlXCIsXG5cdFx0XHRhbWF6b246IFwiZjI3MFwiLFxuXHRcdFx0XCJjYWxlbmRhci1wbHVzLW9cIjogXCJmMjcxXCIsXG5cdFx0XHRcImNhbGVuZGFyLW1pbnVzLW9cIjogXCJmMjcyXCIsXG5cdFx0XHRcImNhbGVuZGFyLXRpbWVzLW9cIjogXCJmMjczXCIsXG5cdFx0XHRcImNhbGVuZGFyLWNoZWNrLW9cIjogXCJmMjc0XCIsXG5cdFx0XHRpbmR1c3RyeTogXCJmMjc1XCIsXG5cdFx0XHRcIm1hcC1waW5cIjogXCJmMjc2XCIsXG5cdFx0XHRcIm1hcC1zaWduc1wiOiBcImYyNzdcIixcblx0XHRcdFwibWFwLW9cIjogXCJmMjc4XCIsXG5cdFx0XHRtYXA6IFwiZjI3OVwiLFxuXHRcdFx0Y29tbWVudGluZzogXCJmMjdhXCIsXG5cdFx0XHRcImNvbW1lbnRpbmctb1wiOiBcImYyN2JcIixcblx0XHRcdGhvdXp6OiBcImYyN2NcIixcblx0XHRcdHZpbWVvOiBcImYyN2RcIixcblx0XHRcdFwiYmxhY2stdGllXCI6IFwiZjI3ZVwiLFxuXHRcdFx0Zm9udGljb25zOiBcImYyODBcIixcblx0XHRcdFwicmVkZGl0LWFsaWVuXCI6IFwiZjI4MVwiLFxuXHRcdFx0ZWRnZTogXCJmMjgyXCIsXG5cdFx0XHRcImNyZWRpdC1jYXJkLWFsdFwiOiBcImYyODNcIixcblx0XHRcdGNvZGllcGllOiBcImYyODRcIixcblx0XHRcdG1vZHg6IFwiZjI4NVwiLFxuXHRcdFx0XCJmb3J0LWF3ZXNvbWVcIjogXCJmMjg2XCIsXG5cdFx0XHR1c2I6IFwiZjI4N1wiLFxuXHRcdFx0XCJwcm9kdWN0LWh1bnRcIjogXCJmMjg4XCIsXG5cdFx0XHRtaXhjbG91ZDogXCJmMjg5XCIsXG5cdFx0XHRzY3JpYmQ6IFwiZjI4YVwiLFxuXHRcdFx0XCJwYXVzZS1jaXJjbGVcIjogXCJmMjhiXCIsXG5cdFx0XHRcInBhdXNlLWNpcmNsZS1vXCI6IFwiZjI4Y1wiLFxuXHRcdFx0XCJzdG9wLWNpcmNsZVwiOiBcImYyOGRcIixcblx0XHRcdFwic3RvcC1jaXJjbGUtb1wiOiBcImYyOGVcIixcblx0XHRcdFwic2hvcHBpbmctYmFnXCI6IFwiZjI5MFwiLFxuXHRcdFx0XCJzaG9wcGluZy1iYXNrZXRcIjogXCJmMjkxXCIsXG5cdFx0XHRoYXNodGFnOiBcImYyOTJcIixcblx0XHRcdGJsdWV0b290aDogXCJmMjkzXCIsXG5cdFx0XHRcImJsdWV0b290aC1iXCI6IFwiZjI5NFwiLFxuXHRcdFx0cGVyY2VudDogXCJmMjk1XCIsXG5cdFx0XHRnaXRsYWI6IFwiZjI5NlwiLFxuXHRcdFx0d3BiZWdpbm5lcjogXCJmMjk3XCIsXG5cdFx0XHR3cGZvcm1zOiBcImYyOThcIixcblx0XHRcdGVudmlyYTogXCJmMjk5XCIsXG5cdFx0XHRcInVuaXZlcnNhbC1hY2Nlc3NcIjogXCJmMjlhXCIsXG5cdFx0XHRcIndoZWVsY2hhaXItYWx0XCI6IFwiZjI5YlwiLFxuXHRcdFx0XCJxdWVzdGlvbi1jaXJjbGUtb1wiOiBcImYyOWNcIixcblx0XHRcdGJsaW5kOiBcImYyOWRcIixcblx0XHRcdFwiYXVkaW8tZGVzY3JpcHRpb25cIjogXCJmMjllXCIsXG5cdFx0XHRcInZvbHVtZS1jb250cm9sLXBob25lXCI6IFwiZjJhMFwiLFxuXHRcdFx0YnJhaWxsZTogXCJmMmExXCIsXG5cdFx0XHRcImFzc2lzdGl2ZS1saXN0ZW5pbmctc3lzdGVtc1wiOiBcImYyYTJcIixcblx0XHRcdFwiYXNsLWludGVycHJldGluZyxhbWVyaWNhbi1zaWduLWxhbmd1YWdlLWludGVycHJldGluZ1wiOiBcImYyYTNcIixcblx0XHRcdFwiZGVhZm5lc3MsaGFyZC1vZi1oZWFyaW5nLGRlYWZcIjogXCJmMmE0XCIsXG5cdFx0XHRnbGlkZTogXCJmMmE1XCIsXG5cdFx0XHRcImdsaWRlLWdcIjogXCJmMmE2XCIsXG5cdFx0XHRcInNpZ25pbmcsc2lnbi1sYW5ndWFnZVwiOiBcImYyYTdcIixcblx0XHRcdFwibG93LXZpc2lvblwiOiBcImYyYThcIixcblx0XHRcdHZpYWRlbzogXCJmMmE5XCIsXG5cdFx0XHRcInZpYWRlby1zcXVhcmVcIjogXCJmMmFhXCIsXG5cdFx0XHRzbmFwY2hhdDogXCJmMmFiXCIsXG5cdFx0XHRcInNuYXBjaGF0LWdob3N0XCI6IFwiZjJhY1wiLFxuXHRcdFx0XCJzbmFwY2hhdC1zcXVhcmVcIjogXCJmMmFkXCIsXG5cdFx0XHRcInBpZWQtcGlwZXJcIjogXCJmMmFlXCIsXG5cdFx0XHRcImZpcnN0LW9yZGVyXCI6IFwiZjJiMFwiLFxuXHRcdFx0eW9hc3Q6IFwiZjJiMVwiLFxuXHRcdFx0dGhlbWVpc2xlOiBcImYyYjJcIixcblx0XHRcdFwiZ29vZ2xlLXBsdXMtY2lyY2xlLGdvb2dsZS1wbHVzLW9mZmljaWFsXCI6IFwiZjJiM1wiLFxuXHRcdFx0XCJmYSxmb250LWF3ZXNvbWVcIjogXCJmMmI0XCJcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gaWNvbihkKSB7XG5cdFx0bGV0IGNvZGU7XG5cblx0XHRpZiAob3B0aW9ucy5pY29uTWFwICYmIG9wdGlvbnMuc2hvd0ljb25zICYmIG9wdGlvbnMuaWNvbnMpIHtcblx0XHRcdGlmIChvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXSAmJiBvcHRpb25zLmljb25NYXBbb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV1dKSB7XG5cdFx0XHRcdGNvZGUgPSBvcHRpb25zLmljb25NYXBbb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV1dO1xuXHRcdFx0fSBlbHNlIGlmIChvcHRpb25zLmljb25NYXBbZC5sYWJlbHNbMF1dKSB7XG5cdFx0XHRcdGNvZGUgPSBvcHRpb25zLmljb25NYXBbZC5sYWJlbHNbMF1dO1xuXHRcdFx0fSBlbHNlIGlmIChvcHRpb25zLmljb25zW2QubGFiZWxzWzBdXSkge1xuXHRcdFx0XHRjb2RlID0gb3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvZGU7XG5cdH1cblxuXHRmdW5jdGlvbiBpbWFnZShkKSB7XG5cdFx0bGV0IGltYWdlc0ZvckxhYmVsLCBpbWcsIGltZ0xldmVsLCBsYWJlbCwgbGFiZWxQcm9wZXJ0eVZhbHVlLCBwcm9wZXJ0eSwgdmFsdWU7XG5cblx0XHRpZiAob3B0aW9ucy5pbWFnZXMpIHtcblx0XHRcdGltYWdlc0ZvckxhYmVsID0gb3B0aW9ucy5pbWFnZU1hcFtkLmxhYmVsc1swXV07XG5cblx0XHRcdGlmIChpbWFnZXNGb3JMYWJlbCkge1xuXHRcdFx0XHRpbWdMZXZlbCA9IDA7XG5cblx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZXNGb3JMYWJlbC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGxhYmVsUHJvcGVydHlWYWx1ZSA9IGltYWdlc0ZvckxhYmVsW2ldLnNwbGl0KFwifFwiKTtcblxuXHRcdFx0XHRcdHN3aXRjaCAobGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0Y2FzZSAzOlxuXHRcdFx0XHRcdFx0XHR2YWx1ZSA9IGxhYmVsUHJvcGVydHlWYWx1ZVsyXTtcblx0XHRcdFx0XHRcdC8qIGZhbGxzIHRocm91Z2ggKi9cblx0XHRcdFx0XHRcdGNhc2UgMjpcblx0XHRcdFx0XHRcdFx0cHJvcGVydHkgPSBsYWJlbFByb3BlcnR5VmFsdWVbMV07XG5cdFx0XHRcdFx0XHQvKiBmYWxscyB0aHJvdWdoICovXG5cdFx0XHRcdFx0XHRjYXNlIDE6XG5cdFx0XHRcdFx0XHRcdGxhYmVsID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzBdO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdGQubGFiZWxzWzBdID09PSBsYWJlbCAmJlxuXHRcdFx0XHRcdFx0KCFwcm9wZXJ0eSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldICE9PSB1bmRlZmluZWQpICYmXG5cdFx0XHRcdFx0XHQoIXZhbHVlIHx8IGQucHJvcGVydGllc1twcm9wZXJ0eV0gPT09IHZhbHVlKVxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0aWYgKGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGggPiBpbWdMZXZlbCkge1xuXHRcdFx0XHRcdFx0XHRpbWcgPSBvcHRpb25zLmltYWdlc1tpbWFnZXNGb3JMYWJlbFtpXV07XG5cdFx0XHRcdFx0XHRcdGltZ0xldmVsID0gbGFiZWxQcm9wZXJ0eVZhbHVlLmxlbmd0aDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gaW1nO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdChfc2VsZWN0b3IsIF9vcHRpb25zKSB7XG5cdFx0aW5pdEljb25NYXAoKTtcblxuXHRcdG1lcmdlKG9wdGlvbnMsIF9vcHRpb25zKTtcblxuXHRcdGlmIChvcHRpb25zLmljb25zKSB7XG5cdFx0XHRvcHRpb25zLnNob3dJY29ucyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFvcHRpb25zLm1pbkNvbGxpc2lvbikge1xuXHRcdFx0b3B0aW9ucy5taW5Db2xsaXNpb24gPSBvcHRpb25zLm5vZGVSYWRpdXMgKiAyO1xuXHRcdH1cblxuXHRcdGluaXRJbWFnZU1hcCgpO1xuXG5cdFx0c2VsZWN0b3IgPSBfc2VsZWN0b3I7XG5cdFx0Y29udGFpbmVyID0gZDMuc2VsZWN0KHNlbGVjdG9yKTtcblx0XHRjb250YWluZXIuYXR0cihcImNsYXNzXCIsIFwibmVvNGpkM1wiKS5odG1sKFwiXCIpO1xuXG5cdFx0aWYgKG9wdGlvbnMuaW5mb1BhbmVsKSB7XG5cdFx0XHRpbmZvID0gYXBwZW5kSW5mb1BhbmVsKGNvbnRhaW5lcik7XG5cdFx0fVxuXG5cdFx0YXBwZW5kR3JhcGgoY29udGFpbmVyKTtcblx0XHRzaW11bGF0aW9uID0gaW5pdFNpbXVsYXRpb24oKTtcblxuXHRcdGlmIChvcHRpb25zLm5lbzRqRGF0YSkge1xuXHRcdFx0bG9hZE5lbzRqRGF0YShvcHRpb25zLm5lbzRqRGF0YSk7XG5cdFx0fSBlbHNlIGlmIChvcHRpb25zLm5lbzRqRGF0YVVybCkge1xuXHRcdFx0bG9hZE5lbzRqRGF0YUZyb21Vcmwob3B0aW9ucy5uZW80akRhdGFVcmwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiRXJyb3I6IGJvdGggbmVvNGpEYXRhIGFuZCBuZW80akRhdGFVcmwgYXJlIGVtcHR5IVwiKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpbml0SWNvbk1hcCgpIHtcblx0XHRPYmplY3Qua2V5cyhvcHRpb25zLmljb25NYXApLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0Y29uc3Qga2V5cyA9IGtleS5zcGxpdChcIixcIik7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IG9wdGlvbnMuaWNvbk1hcFtrZXldO1xuXG5cdFx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuXHRcdFx0XHRvcHRpb25zLmljb25NYXBba2V5XSA9IHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbml0SW1hZ2VNYXAoKSB7XG5cdFx0bGV0IGtleXM7XG5cblx0XHRmb3IgKGNvbnN0IGtleSBpbiBvcHRpb25zLmltYWdlcykge1xuXHRcdFx0aWYgKG9wdGlvbnMuaW1hZ2VzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0a2V5cyA9IGtleS5zcGxpdChcInxcIik7XG5cblx0XHRcdFx0aWYgKCFvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXSA9IFtrZXldO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0ucHVzaChrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gVE9ETzogTWFrZSB0aGlzIG9wdGlvbmFsXG5cdGZ1bmN0aW9uIGluaXRTaW11bGF0aW9uKCkge1xuXHRcdGNvbnN0IHNpbXVsYXRpb24gPSBkM1xuXHRcdFx0LmZvcmNlU2ltdWxhdGlvbigpXG5cdFx0XHQuZm9yY2UoXG5cdFx0XHRcdFwiY29sbGlkZVwiLFxuXHRcdFx0XHRkM1xuXHRcdFx0XHRcdC5mb3JjZUNvbGxpZGUoKVxuXHRcdFx0XHRcdC5yYWRpdXMoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBvcHRpb25zLm1pbkNvbGxpc2lvbjtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pdGVyYXRpb25zKDIpXG5cdFx0XHQpXG5cdFx0XHQuZm9yY2UoXCJjaGFyZ2VcIiwgZDMuZm9yY2VNYW55Qm9keSgpKVxuXHRcdFx0LmZvcmNlKFxuXHRcdFx0XHRcImxpbmtcIixcblx0XHRcdFx0ZDMuZm9yY2VMaW5rKCkuaWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5pZDtcblx0XHRcdFx0fSlcblx0XHRcdClcblx0XHRcdC5mb3JjZShcblx0XHRcdFx0XCJjZW50ZXJcIixcblx0XHRcdFx0ZDMuZm9yY2VDZW50ZXIoXG5cdFx0XHRcdFx0c3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuXHRcdFx0XHRcdHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdFx0Lm9uKFwidGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHRpY2soKTtcblx0XHRcdH0pXG5cdFx0XHQub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAob3B0aW9ucy56b29tRml0ICYmICFqdXN0TG9hZGVkKSB7XG5cdFx0XHRcdFx0anVzdExvYWRlZCA9IHRydWU7XG5cdFx0XHRcdFx0em9vbUZpdCgyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRyZXR1cm4gc2ltdWxhdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGEoKSB7XG5cdFx0bm9kZXMgPSBbXTtcblx0XHRyZWxhdGlvbnNoaXBzID0gW107XG5cblx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGFGcm9tVXJsKG5lbzRqRGF0YVVybCkge1xuXHRcdG5vZGVzID0gW107XG5cdFx0cmVsYXRpb25zaGlwcyA9IFtdO1xuXG5cdFx0ZDMuanNvbihuZW80akRhdGFVcmwpXG5cdFx0XHQudGhlbigoZGF0YSkgPT4ge1xuXHRcdFx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc291cmNlKSB7XG5cdFx0T2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0dGFyZ2V0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBuZW80akRhdGFUb0QzRGF0YShkYXRhKSB7XG5cdFx0Y29uc3QgZ3JhcGggPSB7XG5cdFx0XHRub2RlczogW10sXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBbXVxuXHRcdH07XG5cblx0XHRkYXRhLnJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRyZXN1bHQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdGRhdGEuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0XHRcdGlmICghY29udGFpbnMoZ3JhcGgubm9kZXMsIG5vZGUuaWQpKSB7XG5cdFx0XHRcdFx0XHRncmFwaC5ub2Rlcy5wdXNoKG5vZGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmZvckVhY2goZnVuY3Rpb24gKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC5zb3VyY2UgPSByZWxhdGlvbnNoaXAuc3RhcnROb2RlO1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC50YXJnZXQgPSByZWxhdGlvbnNoaXAuZW5kTm9kZTtcblx0XHRcdFx0XHRncmFwaC5yZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdFx0XHRpZiAoYS5zb3VyY2UgPiBiLnNvdXJjZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChhLnNvdXJjZSA8IGIuc291cmNlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChhLnRhcmdldCA+IGIudGFyZ2V0KSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGEudGFyZ2V0IDwgYi50YXJnZXQgPyAtMSA6IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdGkgIT09IDAgJiZcblx0XHRcdFx0XHRcdGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5zb3VyY2UgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0uc291cmNlICYmXG5cdFx0XHRcdFx0XHRkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0udGFyZ2V0ID09PSBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaSAtIDFdLnRhcmdldFxuXHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLmxpbmtudW0gPSBkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaSAtIDFdLmxpbmtudW0gKyAxO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBncmFwaDtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRvbUQzRGF0YShkLCBtYXhOb2Rlc1RvR2VuZXJhdGUpIHtcblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0bm9kZXM6IFtdLFxuXHRcdFx0cmVsYXRpb25zaGlwczogW11cblx0XHR9O1xuXHRcdGNvbnN0IG51bU5vZGVzID0gKChtYXhOb2Rlc1RvR2VuZXJhdGUgKiBNYXRoLnJhbmRvbSgpKSA8PCAwKSArIDE7XG5cdFx0Y29uc3QgcyA9IHNpemUoKTtcblxuXHRcdGxldCByZWxhdGlvbnNoaXA7XG5cdFx0bGV0IGxhYmVsO1xuXHRcdGxldCBub2RlO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBudW1Ob2RlczsgaSsrKSB7XG5cdFx0XHRsYWJlbCA9IHJhbmRvbUxhYmVsKCk7XG5cblx0XHRcdG5vZGUgPSB7XG5cdFx0XHRcdGlkOiBzLm5vZGVzICsgMSArIGksXG5cdFx0XHRcdGxhYmVsczogW2xhYmVsXSxcblx0XHRcdFx0cHJvcGVydGllczoge1xuXHRcdFx0XHRcdHJhbmRvbTogbGFiZWxcblx0XHRcdFx0fSxcblx0XHRcdFx0eDogZC54LFxuXHRcdFx0XHR5OiBkLnlcblx0XHRcdH07XG5cblx0XHRcdGRhdGEubm9kZXNbZGF0YS5ub2Rlcy5sZW5ndGhdID0gbm9kZTtcblxuXHRcdFx0cmVsYXRpb25zaGlwID0ge1xuXHRcdFx0XHRpZDogcy5yZWxhdGlvbnNoaXBzICsgMSArIGksXG5cdFx0XHRcdHR5cGU6IGxhYmVsLnRvVXBwZXJDYXNlKCksXG5cdFx0XHRcdHN0YXJ0Tm9kZTogZC5pZCxcblx0XHRcdFx0ZW5kTm9kZTogcy5ub2RlcyArIDEgKyBpLFxuXHRcdFx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdFx0ZnJvbTogRGF0ZS5ub3coKVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRzb3VyY2U6IGQuaWQsXG5cdFx0XHRcdHRhcmdldDogcy5ub2RlcyArIDEgKyBpLFxuXHRcdFx0XHRsaW5rbnVtOiBzLnJlbGF0aW9uc2hpcHMgKyAxICsgaVxuXHRcdFx0fTtcblxuXHRcdFx0ZGF0YS5yZWxhdGlvbnNoaXBzW2RhdGEucmVsYXRpb25zaGlwcy5sZW5ndGhdID0gcmVsYXRpb25zaGlwO1xuXHRcdH1cblxuXHRcdHJldHVybiBkYXRhO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZG9tTGFiZWwoKSB7XG5cdFx0Y29uc3QgaWNvbnMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmljb25NYXApO1xuXHRcdHJldHVybiBpY29uc1soaWNvbnMubGVuZ3RoICogTWF0aC5yYW5kb20oKSkgPDwgMF07XG5cdH1cblxuXHRmdW5jdGlvbiByZXNldFdpdGhOZW80akRhdGEobmVvNGpEYXRhKSB7XG5cdFx0Ly8gQ2FsbCB0aGUgaW5pdCBtZXRob2QgYWdhaW4gd2l0aCBuZXcgZGF0YVxuXHRcdGNvbnN0IG5ld09wdGlvbnMgPSBPYmplY3QuYXNzaWduKF9vcHRpb25zLCB7XG5cdFx0XHRuZW80akRhdGE6IG5lbzRqRGF0YSxcblx0XHRcdG5lbzRqRGF0YVVybDogdW5kZWZpbmVkXG5cdFx0fSk7XG5cdFx0aW5pdChfc2VsZWN0b3IsIG5ld09wdGlvbnMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcm90YXRlKGN4LCBjeSwgeCwgeSwgYW5nbGUpIHtcblx0XHRjb25zdCByYWRpYW5zID0gKE1hdGguUEkgLyAxODApICogYW5nbGU7XG5cdFx0Y29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFucyk7XG5cdFx0Y29uc3Qgc2luID0gTWF0aC5zaW4ocmFkaWFucyk7XG5cdFx0Y29uc3QgbnggPSBjb3MgKiAoeCAtIGN4KSArIHNpbiAqICh5IC0gY3kpICsgY3g7XG5cdFx0Y29uc3QgbnkgPSBjb3MgKiAoeSAtIGN5KSAtIHNpbiAqICh4IC0gY3gpICsgY3k7XG5cblx0XHRyZXR1cm4geyB4OiBueCwgeTogbnkgfTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJvdGF0ZVBvaW50KGMsIHAsIGFuZ2xlKSB7XG5cdFx0cmV0dXJuIHJvdGF0ZShjLngsIGMueSwgcC54LCBwLnksIGFuZ2xlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJvdGF0aW9uKHNvdXJjZSwgdGFyZ2V0KSB7XG5cdFx0cmV0dXJuIChNYXRoLmF0YW4yKHRhcmdldC55IC0gc291cmNlLnksIHRhcmdldC54IC0gc291cmNlLngpICogMTgwKSAvIE1hdGguUEk7XG5cdH1cblxuXHRmdW5jdGlvbiBzaXplKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRub2Rlczogbm9kZXMubGVuZ3RoLFxuXHRcdFx0cmVsYXRpb25zaGlwczogcmVsYXRpb25zaGlwcy5sZW5ndGhcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gc3RpY2tOb2RlKGV2ZW50LCBkKSB7XG5cdFx0ZC5meCA9IGV2ZW50Lng7XG5cdFx0ZC5meSA9IGV2ZW50Lnk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrKCkge1xuXHRcdHRpY2tOb2RlcygpO1xuXHRcdHRpY2tSZWxhdGlvbnNoaXBzKCk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrTm9kZXMoKSB7XG5cdFx0aWYgKG5vZGUpIHtcblx0XHRcdG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIiwgXCIgKyBkLnkgKyBcIilcIjtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzKCkge1xuXHRcdGlmIChyZWxhdGlvbnNoaXApIHtcblx0XHRcdHJlbGF0aW9uc2hpcC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdGNvbnN0IGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KTtcblx0XHRcdFx0cmV0dXJuIGB0cmFuc2xhdGUoJHtkLnNvdXJjZS54fSwgJHtkLnNvdXJjZS55fSkgcm90YXRlKCR7YW5nbGV9KWA7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNUZXh0cygpO1xuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNPdXRsaW5lcygpO1xuXHRcdFx0dGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKSB7XG5cdFx0cmVsYXRpb25zaGlwLmVhY2goZnVuY3Rpb24gKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0Y29uc3QgcmVsID0gZDMuc2VsZWN0KHRoaXMpO1xuXHRcdFx0Y29uc3Qgb3V0bGluZSA9IHJlbC5zZWxlY3QoXCIub3V0bGluZVwiKTtcblx0XHRcdGNvbnN0IHRleHQgPSByZWwuc2VsZWN0KFwiLnRleHRcIik7XG5cblx0XHRcdG91dGxpbmUuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0dmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuXHRcdFx0XHRcdGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcblx0XHRcdFx0XHR0ZXh0Qm91bmRpbmdCb3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCksXG5cdFx0XHRcdFx0dGV4dFBhZGRpbmcgPSA1LFxuXHRcdFx0XHRcdHUgPSB1bml0YXJ5VmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0dGV4dE1hcmdpbiA9IHtcblx0XHRcdFx0XHRcdHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LngpICogMC41LFxuXHRcdFx0XHRcdFx0eTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKHRleHRCb3VuZGluZ0JveC53aWR0aCArIHRleHRQYWRkaW5nKSAqIHUueSkgKiAwLjVcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QTEgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCxcblx0XHRcdFx0XHRcdFx0eTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0eyB4OiB0ZXh0TWFyZ2luLnggLSBuLngsIHk6IHRleHRNYXJnaW4ueSAtIG4ueSB9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCwgeTogdGV4dE1hcmdpbi55IH0sIGFuZ2xlKSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LFxuXHRcdFx0XHRcdFx0XHR5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyID0gcm90YXRlUG9pbnQoXG5cdFx0XHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gdGV4dE1hcmdpbi54IC0gbi54LFxuXHRcdFx0XHRcdFx0XHR5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIHRleHRNYXJnaW4ueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnggLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnggLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtXG5cdFx0XHRcdFx0XHRcdFx0bi54IC1cblx0XHRcdFx0XHRcdFx0XHR1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSAtXG5cdFx0XHRcdFx0XHRcdFx0dS55ICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLVxuXHRcdFx0XHRcdFx0XHRcdG4ueCArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1Lnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggK1xuXHRcdFx0XHRcdFx0XHRcdCgtbi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLFxuXHRcdFx0XHRcdFx0XHR5OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnkgLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnkgLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSArXG5cdFx0XHRcdFx0XHRcdFx0KC1uLnkgLSB1LnkpICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRcIk0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEExLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMS55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMS54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjEueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzEueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQxLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMS55ICtcblx0XHRcdFx0XHRcIiBaIE0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRFMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEYyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEcyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMi55ICtcblx0XHRcdFx0XHRcIiBaXCJcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpIHtcblx0XHRyZWxhdGlvbnNoaXBPdmVybGF5LmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25zdCBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfTtcblx0XHRcdGNvbnN0IGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KTtcblx0XHRcdGNvbnN0IG4xID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpO1xuXHRcdFx0Y29uc3QgbiA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0LCA1MCk7XG5cdFx0XHRjb25zdCByb3RhdGVkUG9pbnRBID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgLSBuLngsIHk6IDAgLSBuLnkgfSwgYW5nbGUpO1xuXHRcdFx0Y29uc3Qgcm90YXRlZFBvaW50QiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIG4ueCxcblx0XHRcdFx0XHR5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIG4ueVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhbmdsZVxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHJvdGF0ZWRQb2ludEMgPSByb3RhdGVQb2ludChcblx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggKyBuLnggLSBuMS54LFxuXHRcdFx0XHRcdHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55ICsgbi55IC0gbjEueVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhbmdsZVxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHJvdGF0ZWRQb2ludEQgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIG4ueCAtIG4xLngsIHk6IDAgKyBuLnkgLSBuMS55IH0sIGFuZ2xlKTtcblxuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XCJNIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50QS54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRBLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qi54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRCLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qy54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRDLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50RC54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRELnkgK1xuXHRcdFx0XHRcIiBaXCJcblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCkge1xuXHRcdHJlbGF0aW9uc2hpcFRleHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0Y29uc3QgYW5nbGUgPSAocm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSArIDM2MCkgJSAzNjA7XG5cdFx0XHRjb25zdCBtaXJyb3IgPSBhbmdsZSA+IDkwICYmIGFuZ2xlIDwgMjcwO1xuXHRcdFx0Y29uc3QgY2VudGVyID0geyB4OiAwLCB5OiAwIH07XG5cdFx0XHRjb25zdCBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpO1xuXHRcdFx0Y29uc3QgbldlaWdodCA9IG1pcnJvciA/IDIgOiAtMztcblx0XHRcdGNvbnN0IHBvaW50ID0ge1xuXHRcdFx0XHR4OiAoZC50YXJnZXQueCAtIGQuc291cmNlLngpICogMC41ICsgbi54ICogbldlaWdodCxcblx0XHRcdFx0eTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55KSAqIDAuNSArIG4ueSAqIG5XZWlnaHRcblx0XHRcdH07XG5cdFx0XHRjb25zdCByb3RhdGVkUG9pbnQgPSByb3RhdGVQb2ludChjZW50ZXIsIHBvaW50LCBhbmdsZSk7XG5cblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdGB0cmFuc2xhdGUoJHtyb3RhdGVkUG9pbnQueH0sICR7cm90YXRlZFBvaW50Lnl9KWAgK1xuXHRcdFx0XHRgcm90YXRlKCR7bWlycm9yID8gMTgwIDogMH0pYFxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvU3RyaW5nKGQpIHtcblx0XHRsZXQgcyA9IGQubGFiZWxzID8gZC5sYWJlbHNbMF0gOiBkLnR5cGU7XG5cdFx0cyArPSBcIiAoPGlkPjogXCIgKyBkLmlkO1xuXG5cdFx0T2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0cyArPSBcIiwgXCIgKyBwcm9wZXJ0eSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pO1xuXHRcdH0pO1xuXG5cdFx0cyArPSBcIilcIjtcblx0XHRyZXR1cm4gcztcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlOb3JtYWxWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdGNvbnN0IGNlbnRlciA9IHsgeDogMCwgeTogMCB9O1xuXHRcdGNvbnN0IHZlY3RvciA9IHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCk7XG5cblx0XHRyZXR1cm4gcm90YXRlUG9pbnQoY2VudGVyLCB2ZWN0b3IsIDkwKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdGNvbnN0IGxlbmd0aCA9XG5cdFx0XHRNYXRoLnNxcnQoTWF0aC5wb3codGFyZ2V0LnggLSBzb3VyY2UueCwgMikgKyBNYXRoLnBvdyh0YXJnZXQueSAtIHNvdXJjZS55LCAyKSkgL1xuXHRcdFx0TWF0aC5zcXJ0KG5ld0xlbmd0aCB8fCAxKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR4OiAodGFyZ2V0LnggLSBzb3VyY2UueCkgLyBsZW5ndGgsXG5cdFx0XHR5OiAodGFyZ2V0LnkgLSBzb3VyY2UueSkgLyBsZW5ndGhcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpIHtcblx0XHR1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMoZDNEYXRhLm5vZGVzLCBkM0RhdGEucmVsYXRpb25zaGlwcyk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVXaXRoTmVvNGpEYXRhKG5lbzRqRGF0YSkge1xuXHRcdGNvbnN0IGQzRGF0YSA9IG5lbzRqRGF0YVRvRDNEYXRhKG5lbzRqRGF0YSk7XG5cdFx0dXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlSW5mbyhkKSB7XG5cdFx0Y2xlYXJJbmZvKCk7XG5cblx0XHRpZiAoZC5sYWJlbHMpIHtcblx0XHRcdGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoXCJjbGFzc1wiLCBkLmxhYmVsc1swXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFwcGVuZEluZm9FbGVtZW50UmVsYXRpb25zaGlwKFwiY2xhc3NcIiwgZC50eXBlKTtcblx0XHR9XG5cblx0XHRhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KFwicHJvcGVydHlcIiwgXCImbHQ7aWQmZ3Q7XCIsIGQuaWQpO1xuXG5cdFx0T2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0YXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eShcInByb3BlcnR5XCIsIHByb3BlcnR5LCBKU09OLnN0cmluZ2lmeShkLnByb3BlcnRpZXNbcHJvcGVydHldKSk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlcyhuKSB7XG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobm9kZXMsIG4pO1xuXHRcdG5vZGUgPSBzdmdOb2Rlcy5zZWxlY3RBbGwoXCIubm9kZVwiKS5kYXRhKG5vZGVzLCAoZCkgPT4gZC5pZCk7XG5cblx0XHRjb25zdCBub2RlRW50ZXIgPSBhcHBlbmROb2RlVG9HcmFwaCgpO1xuXHRcdG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMobiwgcikge1xuXHRcdHVwZGF0ZVJlbGF0aW9uc2hpcHMocik7XG5cdFx0dXBkYXRlTm9kZXMobik7XG5cblx0XHRzaW11bGF0aW9uLm5vZGVzKG5vZGVzKTtcblx0XHRzaW11bGF0aW9uLmZvcmNlKFwibGlua1wiKS5saW5rcyhyZWxhdGlvbnNoaXBzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVJlbGF0aW9uc2hpcHMocikge1xuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHJlbGF0aW9uc2hpcHMsIHIpO1xuXHRcdHJlbGF0aW9uc2hpcCA9IHN2Z1JlbGF0aW9uc2hpcHMuc2VsZWN0QWxsKFwiLnJlbGF0aW9uc2hpcFwiKS5kYXRhKHJlbGF0aW9uc2hpcHMsIChkKSA9PiBkLmlkKTtcblxuXHRcdGNvbnN0IHJlbGF0aW9uc2hpcEVudGVyID0gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpO1xuXHRcdHJlbGF0aW9uc2hpcCA9IHJlbGF0aW9uc2hpcEVudGVyLnJlbGF0aW9uc2hpcC5tZXJnZShyZWxhdGlvbnNoaXApO1xuXG5cdFx0cmVsYXRpb25zaGlwT3V0bGluZSA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC5vdXRsaW5lXCIpO1xuXHRcdHJlbGF0aW9uc2hpcE91dGxpbmUgPSByZWxhdGlvbnNoaXBFbnRlci5vdXRsaW5lLm1lcmdlKHJlbGF0aW9uc2hpcE91dGxpbmUpO1xuXG5cdFx0cmVsYXRpb25zaGlwT3ZlcmxheSA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC5vdmVybGF5XCIpO1xuXHRcdHJlbGF0aW9uc2hpcE92ZXJsYXkgPSByZWxhdGlvbnNoaXBFbnRlci5vdmVybGF5Lm1lcmdlKHJlbGF0aW9uc2hpcE92ZXJsYXkpO1xuXG5cdFx0cmVsYXRpb25zaGlwVGV4dCA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC50ZXh0XCIpO1xuXHRcdHJlbGF0aW9uc2hpcFRleHQgPSByZWxhdGlvbnNoaXBFbnRlci50ZXh0Lm1lcmdlKHJlbGF0aW9uc2hpcFRleHQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdmVyc2lvbigpIHtcblx0XHRyZXR1cm4gVkVSU0lPTjtcblx0fVxuXG5cdGZ1bmN0aW9uIHpvb21GaXQodHJhbnNpdGlvbkR1cmF0aW9uKSB7XG5cdFx0Y29uc3QgYm91bmRzID0gc3ZnLm5vZGUoKS5nZXRCQm94KCk7XG5cdFx0Y29uc3QgcGFyZW50ID0gc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0Y29uc3QgZnVsbFdpZHRoID0gcGFyZW50LmNsaWVudFdpZHRoO1xuXHRcdGNvbnN0IGZ1bGxIZWlnaHQgPSBwYXJlbnQuY2xpZW50SGVpZ2h0O1xuXHRcdGNvbnN0IHdpZHRoID0gYm91bmRzLndpZHRoO1xuXHRcdGNvbnN0IGhlaWdodCA9IGJvdW5kcy5oZWlnaHQ7XG5cdFx0Y29uc3QgbWlkWCA9IGJvdW5kcy54ICsgd2lkdGggLyAyO1xuXHRcdGNvbnN0IG1pZFkgPSBib3VuZHMueSArIGhlaWdodCAvIDI7XG5cblx0XHRpZiAod2lkdGggPT09IDAgfHwgaGVpZ2h0ID09PSAwKSB7XG5cdFx0XHQvLyBub3RoaW5nIHRvIGZpdFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN2Z1NjYWxlID0gMC44NSAvIE1hdGgubWF4KHdpZHRoIC8gZnVsbFdpZHRoLCBoZWlnaHQgLyBmdWxsSGVpZ2h0KTtcblx0XHRzdmdUcmFuc2xhdGUgPSBbZnVsbFdpZHRoIC8gMiAtIHN2Z1NjYWxlICogbWlkWCwgZnVsbEhlaWdodCAvIDIgLSBzdmdTY2FsZSAqIG1pZFldO1xuXG5cdFx0c3ZnLmF0dHIoXG5cdFx0XHRcInRyYW5zZm9ybVwiLFxuXHRcdFx0YHRyYW5zbGF0ZSgke3N2Z1RyYW5zbGF0ZVswXX0sICR7c3ZnVHJhbnNsYXRlWzFdfSkgc2NhbGUoJHtzdmdTY2FsZX0pYFxuXHRcdCk7XG5cdH1cblxuXHRpbml0KF9zZWxlY3RvciwgX29wdGlvbnMpO1xuXG5cdHJldHVybiB7XG5cdFx0YXBwZW5kUmFuZG9tRGF0YVRvTm9kZTogYXBwZW5kUmFuZG9tRGF0YVRvTm9kZSxcblx0XHRuZW80akRhdGFUb0QzRGF0YTogbmVvNGpEYXRhVG9EM0RhdGEsXG5cdFx0cmFuZG9tRDNEYXRhOiByYW5kb21EM0RhdGEsXG5cdFx0cmVzZXRXaXRoTmVvNGpEYXRhOiByZXNldFdpdGhOZW80akRhdGEsXG5cdFx0c2l6ZTogc2l6ZSxcblx0XHR1cGRhdGVXaXRoRDNEYXRhOiB1cGRhdGVXaXRoRDNEYXRhLFxuXHRcdHVwZGF0ZVdpdGhOZW80akRhdGE6IHVwZGF0ZVdpdGhOZW80akRhdGEsXG5cdFx0dmVyc2lvbjogdmVyc2lvblxuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5lbzRqRDM7XG4iXX0=
