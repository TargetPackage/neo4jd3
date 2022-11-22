(function (f) {
	if (typeof exports === "object" && typeof module !== "undefined") {
		module.exports = f();
	} else if (typeof define === "function" && define.amd) {
		define([], f);
	} else {
		var g;
		if (typeof window !== "undefined") {
			g = window;
		} else if (typeof global !== "undefined") {
			g = global;
		} else if (typeof self !== "undefined") {
			g = self;
		} else {
			g = this;
		}
		g.Neo4jd3 = f();
	}
})(function () {
	var define, module, exports;
	return (function () {
		function r(e, n, t) {
			function o(i, f) {
				if (!n[i]) {
					if (!e[i]) {
						var c = "function" == typeof require && require;
						if (!f && c) return c(i, !0);
						if (u) return u(i, !0);
						var a = new Error("Cannot find module '" + i + "'");
						throw ((a.code = "MODULE_NOT_FOUND"), a);
					}
					var p = (n[i] = { exports: {} });
					e[i][0].call(
						p.exports,
						function (r) {
							var n = e[i][1][r];
							return o(n || r);
						},
						p,
						p.exports,
						r,
						e,
						n,
						t
					);
				}
				return n[i].exports;
			}
			for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
			return o;
		}
		return r;
	})()(
		{
			1: [
				function (_dereq_, module, exports) {
					"use strict";

					const neo4jd3 = _dereq_("./scripts/neo4jd3");

					module.exports = neo4jd3;
				},
				{ "./scripts/neo4jd3": 2 }
			],
			2: [
				function (_dereq_, module, exports) {
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
									stickNode(d);

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
							return r
								.append("path")
								.attr("class", "outline")
								.attr("fill", "#a5abb6")
								.attr("stroke", "none");
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
							stickNode(d);
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
											data.graph.relationships[i].source ===
												data.graph.relationships[i - 1].source &&
											data.graph.relationships[i].target === data.graph.relationships[i - 1].target
										) {
											data.graph.relationships[i].linknum =
												data.graph.relationships[i - 1].linknum + 1;
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

						function stickNode(d) {
							d.fx = d.x;
							d.fy = d.y;
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
									text = rel.select(".text");

								outline.attr("d", function (d) {
									var center = { x: 0, y: 0 },
										angle = rotation(d.source, d.target),
										textBoundingBox = text.node().getBBox(),
										textPadding = 5,
										u = unitaryVector(d.source, d.target),
										textMargin = {
											x:
												(d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) *
												0.5,
											y:
												(d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) *
												0.5
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
										rotatedPointC1 = rotatePoint(
											center,
											{ x: textMargin.x, y: textMargin.y },
											angle
										),
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
												x:
													d.target.x -
													d.source.x -
													(options.nodeRadius + 1) * u.x -
													u.x * options.arrowSize,
												y:
													d.target.y -
													d.source.y -
													(options.nodeRadius + 1) * u.y -
													u.y * options.arrowSize
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
								const rotatedPointD = rotatePoint(
									center,
									{ x: 0 + n.x - n1.x, y: 0 + n.y - n1.y },
									angle
								);

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
								appendInfoElementProperty(
									"property",
									property,
									JSON.stringify(d.properties[property])
								);
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
							relationship = svgRelationships
								.selectAll(".relationship")
								.data(relationships, (d) => d.id);

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
							var bounds = svg.node().getBBox(),
								parent = svg.node().parentElement.parentElement,
								fullWidth = parent.clientWidth,
								fullHeight = parent.clientHeight,
								width = bounds.width,
								height = bounds.height,
								midX = bounds.x + width / 2,
								midY = bounds.y + height / 2;

							if (width === 0 || height === 0) {
								// nothing to fit
								return;
							}

							svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
							svgTranslate = [fullWidth / 2 - svgScale * midX, fullHeight / 2 - svgScale * midY];

							svg.attr(
								"transform",
								"translate(" +
									svgTranslate[0] +
									", " +
									svgTranslate[1] +
									") scale(" +
									svgScale +
									")"
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
				},
				{}
			]
		},
		{},
		[1]
	)(1);
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy8ucG5wbS9icm93c2VyLXBhY2tANi4xLjAvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluL2luZGV4LmpzIiwic3JjL21haW4vc2NyaXB0cy9uZW80amQzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IG5lbzRqZDMgPSByZXF1aXJlKFwiLi9zY3JpcHRzL25lbzRqZDNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gbmVvNGpkMztcbiIsIi8qIGdsb2JhbCBkMywgZG9jdW1lbnQgKi9cbi8qIGpzaGludCBsYXRlZGVmOm5vZnVuYyAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIE5lbzRqRDMoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuXHR2YXIgY29udGFpbmVyLFxuXHRcdGluZm8sXG5cdFx0bm9kZSxcblx0XHRub2Rlcyxcblx0XHRyZWxhdGlvbnNoaXAsXG5cdFx0cmVsYXRpb25zaGlwT3V0bGluZSxcblx0XHRyZWxhdGlvbnNoaXBPdmVybGF5LFxuXHRcdHJlbGF0aW9uc2hpcFRleHQsXG5cdFx0cmVsYXRpb25zaGlwcyxcblx0XHRzZWxlY3Rvcixcblx0XHRzaW11bGF0aW9uLFxuXHRcdHN2Zyxcblx0XHRzdmdOb2Rlcyxcblx0XHRzdmdSZWxhdGlvbnNoaXBzLFxuXHRcdHN2Z1NjYWxlLFxuXHRcdHN2Z1RyYW5zbGF0ZSxcblx0XHRjbGFzc2VzMmNvbG9ycyA9IHt9LFxuXHRcdGp1c3RMb2FkZWQgPSBmYWxzZSxcblx0XHRudW1DbGFzc2VzID0gMCxcblx0XHRvcHRpb25zID0ge1xuXHRcdFx0YXJyb3dTaXplOiA0LFxuXHRcdFx0Y29sb3JzOiBjb2xvcnMoKSxcblx0XHRcdGhpZ2hsaWdodDogdW5kZWZpbmVkLFxuXHRcdFx0aWNvbk1hcDogZm9udEF3ZXNvbWVJY29ucygpLFxuXHRcdFx0aWNvbnM6IHVuZGVmaW5lZCxcblx0XHRcdGltYWdlTWFwOiB7fSxcblx0XHRcdGltYWdlczogdW5kZWZpbmVkLFxuXHRcdFx0aW5mb1BhbmVsOiB0cnVlLFxuXHRcdFx0bWluQ29sbGlzaW9uOiB1bmRlZmluZWQsXG5cdFx0XHRuZW80akRhdGE6IHVuZGVmaW5lZCxcblx0XHRcdG5lbzRqRGF0YVVybDogdW5kZWZpbmVkLFxuXHRcdFx0bm9kZU91dGxpbmVGaWxsQ29sb3I6IHVuZGVmaW5lZCxcblx0XHRcdG5vZGVSYWRpdXM6IDI1LFxuXHRcdFx0bm9kZVRleHRQcm9wZXJ0eTogdW5kZWZpbmVkLFxuXHRcdFx0bm9kZVRleHRDb2xvcjogXCIjZmZmZmZmXCIsXG5cdFx0XHRyZWxhdGlvbnNoaXBDb2xvcjogXCIjYTVhYmI2XCIsXG5cdFx0XHR6b29tRml0OiBmYWxzZVxuXHRcdH0sXG5cdFx0VkVSU0lPTiA9IFwiMC4wLjFcIjtcblxuXHRmdW5jdGlvbiBhcHBlbmRHcmFwaChjb250YWluZXIpIHtcblx0XHRzdmcgPSBjb250YWluZXJcblx0XHRcdC5hcHBlbmQoXCJzdmdcIilcblx0XHRcdC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG5cdFx0XHQuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJuZW80amQzLWdyYXBoXCIpXG5cdFx0XHQuY2FsbChcblx0XHRcdFx0ZDMuem9vbSgpLm9uKFwiem9vbVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRcdFx0XHRsZXQgc2NhbGUgPSBldmVudC50cmFuc2Zvcm0uaztcblx0XHRcdFx0XHRsZXQgdHJhbnNsYXRlID0gW2V2ZW50LnRyYW5zZm9ybS54LCBldmVudC50cmFuc2Zvcm0ueV07XG5cblx0XHRcdFx0XHRpZiAoc3ZnVHJhbnNsYXRlKSB7XG5cdFx0XHRcdFx0XHR0cmFuc2xhdGVbMF0gKz0gc3ZnVHJhbnNsYXRlWzBdO1xuXHRcdFx0XHRcdFx0dHJhbnNsYXRlWzFdICs9IHN2Z1RyYW5zbGF0ZVsxXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc3ZnU2NhbGUpIHtcblx0XHRcdFx0XHRcdHNjYWxlICo9IHN2Z1NjYWxlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHN2Zy5hdHRyKFxuXHRcdFx0XHRcdFx0XCJ0cmFuc2Zvcm1cIixcblx0XHRcdFx0XHRcdFwidHJhbnNsYXRlKFwiICsgdHJhbnNsYXRlWzBdICsgXCIsIFwiICsgdHJhbnNsYXRlWzFdICsgXCIpIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIlxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH0pXG5cdFx0XHQpXG5cdFx0XHQub24oXCJkYmxjbGljay56b29tXCIsIG51bGwpXG5cdFx0XHQuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcblxuXHRcdHN2Z1JlbGF0aW9uc2hpcHMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJyZWxhdGlvbnNoaXBzXCIpO1xuXG5cdFx0c3ZnTm9kZXMgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJub2Rlc1wiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEltYWdlVG9Ob2RlKG5vZGUpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmFwcGVuZChcImltYWdlXCIpXG5cdFx0XHQuYXR0cihcImhlaWdodFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gXCI1cHhcIiA6IFwiLTE1cHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInhsaW5rOmhyZWZcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIGltYWdlKGQpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiNXB4XCIgOiBcIi0xNnB4XCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gaWNvbihkKSA/IFwiMjRweFwiIDogXCIzMHB4XCI7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpIHtcblx0XHRyZXR1cm4gY29udGFpbmVyLmFwcGVuZChcImRpdlwiKS5hdHRyKFwiY2xhc3NcIiwgXCJuZW80amQzLWluZm9cIik7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRJbmZvRWxlbWVudChjbHMsIGlzTm9kZSwgcHJvcGVydHksIHZhbHVlKSB7XG5cdFx0dmFyIGVsZW0gPSBpbmZvLmFwcGVuZChcImFcIik7XG5cblx0XHRlbGVtXG5cdFx0XHQuYXR0cihcImhyZWZcIiwgXCIjXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGNscylcblx0XHRcdC5odG1sKFwiPHN0cm9uZz5cIiArIHByb3BlcnR5ICsgXCI8L3N0cm9uZz5cIiArICh2YWx1ZSA/IFwiOiBcIiArIHZhbHVlIDogXCJcIikpO1xuXG5cdFx0aWYgKCF2YWx1ZSkge1xuXHRcdFx0ZWxlbVxuXHRcdFx0XHQuc3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgP1xuXHRcdFx0XHRcdFx0b3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvclxuXHRcdFx0XHRcdFx0OiBpc05vZGUgP1xuXHRcdFx0XHRcdFx0XHRjbGFzczJjb2xvcihwcm9wZXJ0eSlcblx0XHRcdFx0XHRcdFx0OiBkZWZhdWx0Q29sb3IoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LnN0eWxlKFwiYm9yZGVyLWNvbG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgP1xuXHRcdFx0XHRcdFx0Y2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcilcblx0XHRcdFx0XHRcdDogaXNOb2RlID9cblx0XHRcdFx0XHRcdFx0Y2xhc3MyZGFya2VuQ29sb3IocHJvcGVydHkpXG5cdFx0XHRcdFx0XHRcdDogZGVmYXVsdERhcmtlbkNvbG9yKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5zdHlsZShcImNvbG9yXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbnMubm9kZU91dGxpbmVGaWxsQ29sb3IgP1xuXHRcdFx0XHRcdFx0Y2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcilcblx0XHRcdFx0XHRcdDogXCIjZmZmXCI7XG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoY2xzLCBub2RlKSB7XG5cdFx0YXBwZW5kSW5mb0VsZW1lbnQoY2xzLCB0cnVlLCBub2RlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZEluZm9FbGVtZW50UHJvcGVydHkoY2xzLCBwcm9wZXJ0eSwgdmFsdWUpIHtcblx0XHRhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kSW5mb0VsZW1lbnRSZWxhdGlvbnNoaXAoY2xzLCByZWxhdGlvbnNoaXApIHtcblx0XHRhcHBlbmRJbmZvRWxlbWVudChjbHMsIGZhbHNlLCByZWxhdGlvbnNoaXApO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kTm9kZSgpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmVudGVyKClcblx0XHRcdC5hcHBlbmQoXCJnXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdGxldCBjbGFzc2VzID0gXCJub2RlXCI7XG5cblx0XHRcdFx0aWYgKGljb24oZCkpIHtcblx0XHRcdFx0XHRjbGFzc2VzICs9IFwiIG5vZGUtaWNvblwiO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGltYWdlKGQpKSB7XG5cdFx0XHRcdFx0Y2xhc3NlcyArPSBcIiBub2RlLWltYWdlXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3B0aW9ucy5oaWdobGlnaHQpIHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRsZXQgaGlnaGxpZ2h0ID0gb3B0aW9ucy5oaWdobGlnaHRbaV07XG5cblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0ZC5sYWJlbHNbMF0gPT09IGhpZ2hsaWdodC5jbGFzcyAmJlxuXHRcdFx0XHRcdFx0XHRkLnByb3BlcnRpZXNbaGlnaGxpZ2h0LnByb3BlcnR5XSA9PT0gaGlnaGxpZ2h0LnZhbHVlXG5cdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0Y2xhc3NlcyArPSBcIiBub2RlLWhpZ2hsaWdodGVkXCI7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBjbGFzc2VzO1xuXHRcdFx0fSlcblx0XHRcdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCwgZCkge1xuXHRcdFx0XHRkLmZ4ID0gZC5meSA9IG51bGw7XG5cblx0XHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZUNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRvcHRpb25zLm9uTm9kZUNsaWNrKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwiZGJsY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50LCBkKSB7XG5cdFx0XHRcdHN0aWNrTm9kZShkKTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2sgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdG9wdGlvbnMub25Ob2RlRG91YmxlQ2xpY2soZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChldmVudCwgZCkge1xuXHRcdFx0XHRpZiAoaW5mbykge1xuXHRcdFx0XHRcdHVwZGF0ZUluZm8oZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VFbnRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vbk5vZGVNb3VzZUVudGVyKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0Lm9uKFwibW91c2VsZWF2ZVwiLCBmdW5jdGlvbiAoZXZlbnQsIGQpIHtcblx0XHRcdFx0aWYgKGluZm8pIHtcblx0XHRcdFx0XHRjbGVhckluZm8oZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlTW91c2VMZWF2ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5vbk5vZGVNb3VzZUxlYXZlKGQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LmNhbGwoZDMuZHJhZygpLm9uKFwic3RhcnRcIiwgZHJhZ1N0YXJ0ZWQpLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKS5vbihcImVuZFwiLCBkcmFnRW5kZWQpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZE5vZGVUb0dyYXBoKCkge1xuXHRcdGNvbnN0IG4gPSBhcHBlbmROb2RlKCk7XG5cblx0XHRhcHBlbmRSaW5nVG9Ob2RlKG4pO1xuXHRcdGFwcGVuZE91dGxpbmVUb05vZGUobik7XG5cblx0XHRpZiAob3B0aW9ucy5pY29ucykge1xuXHRcdFx0YXBwZW5kVGV4dFRvTm9kZShuKTtcblx0XHR9XG5cblx0XHRpZiAob3B0aW9ucy5pbWFnZXMpIHtcblx0XHRcdGFwcGVuZEltYWdlVG9Ob2RlKG4pO1xuXHRcdH1cblxuXHRcdHJldHVybiBuO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kT3V0bGluZVRvTm9kZShub2RlKSB7XG5cdFx0cmV0dXJuIG5vZGVcblx0XHRcdC5hcHBlbmQoXCJjaXJjbGVcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJvdXRsaW5lXCIpXG5cdFx0XHQuYXR0cihcInJcIiwgb3B0aW9ucy5ub2RlUmFkaXVzKVxuXHRcdFx0LnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/XG5cdFx0XHRcdFx0b3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvclxuXHRcdFx0XHRcdDogY2xhc3MyY29sb3IoZC5sYWJlbHNbMF0pO1xuXHRcdFx0fSlcblx0XHRcdC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gb3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvciA/XG5cdFx0XHRcdFx0Y2xhc3MyZGFya2VuQ29sb3Iob3B0aW9ucy5ub2RlT3V0bGluZUZpbGxDb2xvcilcblx0XHRcdFx0XHQ6IGNsYXNzMmRhcmtlbkNvbG9yKGQubGFiZWxzWzBdKTtcblx0XHRcdH0pXG5cdFx0XHQuYXBwZW5kKFwidGl0bGVcIilcblx0XHRcdC50ZXh0KGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiB0b1N0cmluZyhkKTtcblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kUmluZ1RvTm9kZShub2RlKSB7XG5cdFx0cmV0dXJuIG5vZGVcblx0XHRcdC5hcHBlbmQoXCJjaXJjbGVcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJyaW5nXCIpXG5cdFx0XHQuYXR0cihcInJcIiwgb3B0aW9ucy5ub2RlUmFkaXVzICogMS4xNilcblx0XHRcdC5hcHBlbmQoXCJ0aXRsZVwiKVxuXHRcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIHRvU3RyaW5nKGQpO1xuXHRcdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRUZXh0VG9Ob2RlKG5vZGUpIHtcblx0XHRyZXR1cm4gbm9kZVxuXHRcdFx0LmFwcGVuZChcInRleHRcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIFwidGV4dFwiICsgKGljb24oZCkgPyBcIiBpY29uXCIgOiBcIlwiKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgb3B0aW9ucy5ub2RlVGV4dENvbG9yKVxuXHRcdFx0LmF0dHIoXCJmb250LXNpemVcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIGljb24oZCkgPyBvcHRpb25zLm5vZGVSYWRpdXMgKyBcInB4XCIgOiBcIjEwcHhcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXHRcdFx0LmF0dHIoXCJ5XCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBpY29uKGQpID8gcGFyc2VJbnQoTWF0aC5yb3VuZChvcHRpb25zLm5vZGVSYWRpdXMgKiAwLjMyKSkgKyBcInB4XCIgOiBcIjRweFwiO1xuXHRcdFx0fSlcblx0XHRcdC5odG1sKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdGNvbnN0IF9pY29uID0gaWNvbihkKTtcblx0XHRcdFx0bGV0IHRleHQgPSBkLmlkO1xuXHRcdFx0XHRpZiAob3B0aW9ucy5ub2RlVGV4dFByb3BlcnR5KSB7XG5cdFx0XHRcdFx0dGV4dCA9IGQucHJvcGVydGllc1tvcHRpb25zLm5vZGVUZXh0UHJvcGVydHldO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIF9pY29uID8gXCImI3hcIiArIF9pY29uIDogdGV4dDtcblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kUmFuZG9tRGF0YVRvTm9kZShkLCBtYXhOb2Rlc1RvR2VuZXJhdGUpIHtcblx0XHRjb25zdCBkYXRhID0gcmFuZG9tRDNEYXRhKGQsIG1heE5vZGVzVG9HZW5lcmF0ZSk7XG5cdFx0dXBkYXRlV2l0aE5lbzRqRGF0YShkYXRhKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZFJlbGF0aW9uc2hpcCgpIHtcblx0XHRyZXR1cm4gcmVsYXRpb25zaGlwXG5cdFx0XHQuZW50ZXIoKVxuXHRcdFx0LmFwcGVuZChcImdcIilcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJyZWxhdGlvbnNoaXBcIilcblx0XHRcdC5vbihcImRibGNsaWNrXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5vblJlbGF0aW9uc2hpcERvdWJsZUNsaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHRvcHRpb25zLm9uUmVsYXRpb25zaGlwRG91YmxlQ2xpY2soZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0XHQub24oXCJtb3VzZWVudGVyXCIsIGZ1bmN0aW9uIChldmVudCwgZCkge1xuXHRcdFx0XHRpZiAoaW5mbykge1xuXHRcdFx0XHRcdHVwZGF0ZUluZm8oZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kT3V0bGluZVRvUmVsYXRpb25zaGlwKHIpIHtcblx0XHRyZXR1cm4gci5hcHBlbmQoXCJwYXRoXCIpLmF0dHIoXCJjbGFzc1wiLCBcIm91dGxpbmVcIikuYXR0cihcImZpbGxcIiwgXCIjYTVhYmI2XCIpLmF0dHIoXCJzdHJva2VcIiwgXCJub25lXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kT3ZlcmxheVRvUmVsYXRpb25zaGlwKHIpIHtcblx0XHRyZXR1cm4gci5hcHBlbmQoXCJwYXRoXCIpLmF0dHIoXCJjbGFzc1wiLCBcIm92ZXJsYXlcIik7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRUZXh0VG9SZWxhdGlvbnNoaXAocikge1xuXHRcdHJldHVybiByXG5cdFx0XHQuYXBwZW5kKFwidGV4dFwiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInRleHRcIilcblx0XHRcdC5hdHRyKFwiZmlsbFwiLCBcIiMwMDAwMDBcIilcblx0XHRcdC5hdHRyKFwiZm9udC1zaXplXCIsIFwiOHB4XCIpXG5cdFx0XHQuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuXHRcdFx0LnRleHQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuIGQudHlwZTtcblx0XHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpIHtcblx0XHRjb25zdCByZWxhdGlvbnNoaXAgPSBhcHBlbmRSZWxhdGlvbnNoaXAoKTtcblx0XHRjb25zdCB0ZXh0ID0gYXBwZW5kVGV4dFRvUmVsYXRpb25zaGlwKHJlbGF0aW9uc2hpcCk7XG5cdFx0Y29uc3Qgb3V0bGluZSA9IGFwcGVuZE91dGxpbmVUb1JlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApO1xuXHRcdGNvbnN0IG92ZXJsYXkgPSBhcHBlbmRPdmVybGF5VG9SZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRvdXRsaW5lLFxuXHRcdFx0b3ZlcmxheSxcblx0XHRcdHJlbGF0aW9uc2hpcCxcblx0XHRcdHRleHRcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xhc3MyY29sb3IoY2xzKSB7XG5cdFx0bGV0IGNvbG9yID0gY2xhc3NlczJjb2xvcnNbY2xzXTtcblxuXHRcdGlmICghY29sb3IpIHtcblx0XHRcdGNvbG9yID0gb3B0aW9ucy5jb2xvcnNbbnVtQ2xhc3NlcyAlIG9wdGlvbnMuY29sb3JzLmxlbmd0aF07XG5cdFx0XHRjbGFzc2VzMmNvbG9yc1tjbHNdID0gY29sb3I7XG5cdFx0XHRudW1DbGFzc2VzKys7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbG9yO1xuXHR9XG5cblx0ZnVuY3Rpb24gY2xhc3MyZGFya2VuQ29sb3IoY2xzKSB7XG5cdFx0cmV0dXJuIGQzLnJnYihjbGFzczJjb2xvcihjbHMpKS5kYXJrZXIoMSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjbGVhckluZm8oKSB7XG5cdFx0aW5mby5odG1sKFwiXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29sb3JzKCkge1xuXHRcdHJldHVybiBbXG5cdFx0XHRcIiM2OGJkZjZcIiwgLy8gbGlnaHQgYmx1ZVxuXHRcdFx0XCIjNmRjZTllXCIsIC8vIGdyZWVuICMxXG5cdFx0XHRcIiNmYWFmYzJcIiwgLy8gbGlnaHQgcGlua1xuXHRcdFx0XCIjZjJiYWY2XCIsIC8vIHB1cnBsZVxuXHRcdFx0XCIjZmY5MjhjXCIsIC8vIGxpZ2h0IHJlZFxuXHRcdFx0XCIjZmNlYTdlXCIsIC8vIGxpZ2h0IHllbGxvd1xuXHRcdFx0XCIjZmZjNzY2XCIsIC8vIGxpZ2h0IG9yYW5nZVxuXHRcdFx0XCIjNDA1ZjllXCIsIC8vIG5hdnkgYmx1ZVxuXHRcdFx0XCIjYTVhYmI2XCIsIC8vIGRhcmsgZ3JheVxuXHRcdFx0XCIjNzhjZWNiXCIsIC8vIGdyZWVuICMyLFxuXHRcdFx0XCIjYjg4Y2JiXCIsIC8vIGRhcmsgcHVycGxlXG5cdFx0XHRcIiNjZWQyZDlcIiwgLy8gbGlnaHQgZ3JheVxuXHRcdFx0XCIjZTg0NjQ2XCIsIC8vIGRhcmsgcmVkXG5cdFx0XHRcIiNmYTVmODZcIiwgLy8gZGFyayBwaW5rXG5cdFx0XHRcIiNmZmFiMWFcIiwgLy8gZGFyayBvcmFuZ2Vcblx0XHRcdFwiI2ZjZGExOVwiLCAvLyBkYXJrIHllbGxvd1xuXHRcdFx0XCIjNzk3YjgwXCIsIC8vIGJsYWNrXG5cdFx0XHRcIiNjOWQ5NmZcIiwgLy8gcGlzdGFjY2hpb1xuXHRcdFx0XCIjNDc5OTFmXCIsIC8vIGdyZWVuICMzXG5cdFx0XHRcIiM3MGVkZWVcIiwgLy8gdHVycXVvaXNlXG5cdFx0XHRcIiNmZjc1ZWFcIiAvLyBwaW5rXG5cdFx0XTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnRhaW5zKGFycmF5LCBpZCkge1xuXHRcdGNvbnN0IGZpbHRlciA9IGFycmF5LmZpbHRlcigoZWxlbSkgPT4gZWxlbS5pZCA9PT0gaWQpO1xuXHRcdHJldHVybiBmaWx0ZXIubGVuZ3RoID4gMDtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlZmF1bHRDb2xvcigpIHtcblx0XHRyZXR1cm4gb3B0aW9ucy5yZWxhdGlvbnNoaXBDb2xvcjtcblx0fVxuXG5cdGZ1bmN0aW9uIGRlZmF1bHREYXJrZW5Db2xvcigpIHtcblx0XHRyZXR1cm4gZDMucmdiKG9wdGlvbnMuY29sb3JzW29wdGlvbnMuY29sb3JzLmxlbmd0aCAtIDFdKS5kYXJrZXIoMSk7XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFnRW5kZWQoZXZlbnQsIGQpIHtcblx0XHRpZiAoIWV2ZW50LmFjdGl2ZSkge1xuXHRcdFx0c2ltdWxhdGlvbi5hbHBoYVRhcmdldCgwKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIG9wdGlvbnMub25Ob2RlRHJhZ0VuZCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRvcHRpb25zLm9uTm9kZURyYWdFbmQoZCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ2dlZChldmVudCwgZCkge1xuXHRcdHN0aWNrTm9kZShkKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRyYWdTdGFydGVkKGV2ZW50LCBkKSB7XG5cdFx0aWYgKCFldmVudC5hY3RpdmUpIHtcblx0XHRcdHNpbXVsYXRpb24uYWxwaGFUYXJnZXQoMC4zKS5yZXN0YXJ0KCk7XG5cdFx0fVxuXG5cdFx0ZC5meCA9IGQueDtcblx0XHRkLmZ5ID0gZC55O1xuXG5cdFx0aWYgKHR5cGVvZiBvcHRpb25zLm9uTm9kZURyYWdTdGFydCA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRvcHRpb25zLm9uTm9kZURyYWdTdGFydChkKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBmb250QXdlc29tZUljb25zKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRnbGFzczogXCJmMDAwXCIsXG5cdFx0XHRtdXNpYzogXCJmMDAxXCIsXG5cdFx0XHRzZWFyY2g6IFwiZjAwMlwiLFxuXHRcdFx0XCJlbnZlbG9wZS1vXCI6IFwiZjAwM1wiLFxuXHRcdFx0aGVhcnQ6IFwiZjAwNFwiLFxuXHRcdFx0c3RhcjogXCJmMDA1XCIsXG5cdFx0XHRcInN0YXItb1wiOiBcImYwMDZcIixcblx0XHRcdHVzZXI6IFwiZjAwN1wiLFxuXHRcdFx0ZmlsbTogXCJmMDA4XCIsXG5cdFx0XHRcInRoLWxhcmdlXCI6IFwiZjAwOVwiLFxuXHRcdFx0dGg6IFwiZjAwYVwiLFxuXHRcdFx0XCJ0aC1saXN0XCI6IFwiZjAwYlwiLFxuXHRcdFx0Y2hlY2s6IFwiZjAwY1wiLFxuXHRcdFx0XCJyZW1vdmUsY2xvc2UsdGltZXNcIjogXCJmMDBkXCIsXG5cdFx0XHRcInNlYXJjaC1wbHVzXCI6IFwiZjAwZVwiLFxuXHRcdFx0XCJzZWFyY2gtbWludXNcIjogXCJmMDEwXCIsXG5cdFx0XHRcInBvd2VyLW9mZlwiOiBcImYwMTFcIixcblx0XHRcdHNpZ25hbDogXCJmMDEyXCIsXG5cdFx0XHRcImdlYXIsY29nXCI6IFwiZjAxM1wiLFxuXHRcdFx0XCJ0cmFzaC1vXCI6IFwiZjAxNFwiLFxuXHRcdFx0aG9tZTogXCJmMDE1XCIsXG5cdFx0XHRcImZpbGUtb1wiOiBcImYwMTZcIixcblx0XHRcdFwiY2xvY2stb1wiOiBcImYwMTdcIixcblx0XHRcdHJvYWQ6IFwiZjAxOFwiLFxuXHRcdFx0ZG93bmxvYWQ6IFwiZjAxOVwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtby1kb3duXCI6IFwiZjAxYVwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtby11cFwiOiBcImYwMWJcIixcblx0XHRcdGluYm94OiBcImYwMWNcIixcblx0XHRcdFwicGxheS1jaXJjbGUtb1wiOiBcImYwMWRcIixcblx0XHRcdFwicm90YXRlLXJpZ2h0LHJlcGVhdFwiOiBcImYwMWVcIixcblx0XHRcdHJlZnJlc2g6IFwiZjAyMVwiLFxuXHRcdFx0XCJsaXN0LWFsdFwiOiBcImYwMjJcIixcblx0XHRcdGxvY2s6IFwiZjAyM1wiLFxuXHRcdFx0ZmxhZzogXCJmMDI0XCIsXG5cdFx0XHRoZWFkcGhvbmVzOiBcImYwMjVcIixcblx0XHRcdFwidm9sdW1lLW9mZlwiOiBcImYwMjZcIixcblx0XHRcdFwidm9sdW1lLWRvd25cIjogXCJmMDI3XCIsXG5cdFx0XHRcInZvbHVtZS11cFwiOiBcImYwMjhcIixcblx0XHRcdHFyY29kZTogXCJmMDI5XCIsXG5cdFx0XHRiYXJjb2RlOiBcImYwMmFcIixcblx0XHRcdHRhZzogXCJmMDJiXCIsXG5cdFx0XHR0YWdzOiBcImYwMmNcIixcblx0XHRcdGJvb2s6IFwiZjAyZFwiLFxuXHRcdFx0Ym9va21hcms6IFwiZjAyZVwiLFxuXHRcdFx0cHJpbnQ6IFwiZjAyZlwiLFxuXHRcdFx0Y2FtZXJhOiBcImYwMzBcIixcblx0XHRcdGZvbnQ6IFwiZjAzMVwiLFxuXHRcdFx0Ym9sZDogXCJmMDMyXCIsXG5cdFx0XHRpdGFsaWM6IFwiZjAzM1wiLFxuXHRcdFx0XCJ0ZXh0LWhlaWdodFwiOiBcImYwMzRcIixcblx0XHRcdFwidGV4dC13aWR0aFwiOiBcImYwMzVcIixcblx0XHRcdFwiYWxpZ24tbGVmdFwiOiBcImYwMzZcIixcblx0XHRcdFwiYWxpZ24tY2VudGVyXCI6IFwiZjAzN1wiLFxuXHRcdFx0XCJhbGlnbi1yaWdodFwiOiBcImYwMzhcIixcblx0XHRcdFwiYWxpZ24tanVzdGlmeVwiOiBcImYwMzlcIixcblx0XHRcdGxpc3Q6IFwiZjAzYVwiLFxuXHRcdFx0XCJkZWRlbnQsb3V0ZGVudFwiOiBcImYwM2JcIixcblx0XHRcdGluZGVudDogXCJmMDNjXCIsXG5cdFx0XHRcInZpZGVvLWNhbWVyYVwiOiBcImYwM2RcIixcblx0XHRcdFwicGhvdG8saW1hZ2UscGljdHVyZS1vXCI6IFwiZjAzZVwiLFxuXHRcdFx0cGVuY2lsOiBcImYwNDBcIixcblx0XHRcdFwibWFwLW1hcmtlclwiOiBcImYwNDFcIixcblx0XHRcdGFkanVzdDogXCJmMDQyXCIsXG5cdFx0XHR0aW50OiBcImYwNDNcIixcblx0XHRcdFwiZWRpdCxwZW5jaWwtc3F1YXJlLW9cIjogXCJmMDQ0XCIsXG5cdFx0XHRcInNoYXJlLXNxdWFyZS1vXCI6IFwiZjA0NVwiLFxuXHRcdFx0XCJjaGVjay1zcXVhcmUtb1wiOiBcImYwNDZcIixcblx0XHRcdGFycm93czogXCJmMDQ3XCIsXG5cdFx0XHRcInN0ZXAtYmFja3dhcmRcIjogXCJmMDQ4XCIsXG5cdFx0XHRcImZhc3QtYmFja3dhcmRcIjogXCJmMDQ5XCIsXG5cdFx0XHRiYWNrd2FyZDogXCJmMDRhXCIsXG5cdFx0XHRwbGF5OiBcImYwNGJcIixcblx0XHRcdHBhdXNlOiBcImYwNGNcIixcblx0XHRcdHN0b3A6IFwiZjA0ZFwiLFxuXHRcdFx0Zm9yd2FyZDogXCJmMDRlXCIsXG5cdFx0XHRcImZhc3QtZm9yd2FyZFwiOiBcImYwNTBcIixcblx0XHRcdFwic3RlcC1mb3J3YXJkXCI6IFwiZjA1MVwiLFxuXHRcdFx0ZWplY3Q6IFwiZjA1MlwiLFxuXHRcdFx0XCJjaGV2cm9uLWxlZnRcIjogXCJmMDUzXCIsXG5cdFx0XHRcImNoZXZyb24tcmlnaHRcIjogXCJmMDU0XCIsXG5cdFx0XHRcInBsdXMtY2lyY2xlXCI6IFwiZjA1NVwiLFxuXHRcdFx0XCJtaW51cy1jaXJjbGVcIjogXCJmMDU2XCIsXG5cdFx0XHRcInRpbWVzLWNpcmNsZVwiOiBcImYwNTdcIixcblx0XHRcdFwiY2hlY2stY2lyY2xlXCI6IFwiZjA1OFwiLFxuXHRcdFx0XCJxdWVzdGlvbi1jaXJjbGVcIjogXCJmMDU5XCIsXG5cdFx0XHRcImluZm8tY2lyY2xlXCI6IFwiZjA1YVwiLFxuXHRcdFx0Y3Jvc3NoYWlyczogXCJmMDViXCIsXG5cdFx0XHRcInRpbWVzLWNpcmNsZS1vXCI6IFwiZjA1Y1wiLFxuXHRcdFx0XCJjaGVjay1jaXJjbGUtb1wiOiBcImYwNWRcIixcblx0XHRcdGJhbjogXCJmMDVlXCIsXG5cdFx0XHRcImFycm93LWxlZnRcIjogXCJmMDYwXCIsXG5cdFx0XHRcImFycm93LXJpZ2h0XCI6IFwiZjA2MVwiLFxuXHRcdFx0XCJhcnJvdy11cFwiOiBcImYwNjJcIixcblx0XHRcdFwiYXJyb3ctZG93blwiOiBcImYwNjNcIixcblx0XHRcdFwibWFpbC1mb3J3YXJkLHNoYXJlXCI6IFwiZjA2NFwiLFxuXHRcdFx0ZXhwYW5kOiBcImYwNjVcIixcblx0XHRcdGNvbXByZXNzOiBcImYwNjZcIixcblx0XHRcdHBsdXM6IFwiZjA2N1wiLFxuXHRcdFx0bWludXM6IFwiZjA2OFwiLFxuXHRcdFx0YXN0ZXJpc2s6IFwiZjA2OVwiLFxuXHRcdFx0XCJleGNsYW1hdGlvbi1jaXJjbGVcIjogXCJmMDZhXCIsXG5cdFx0XHRnaWZ0OiBcImYwNmJcIixcblx0XHRcdGxlYWY6IFwiZjA2Y1wiLFxuXHRcdFx0ZmlyZTogXCJmMDZkXCIsXG5cdFx0XHRleWU6IFwiZjA2ZVwiLFxuXHRcdFx0XCJleWUtc2xhc2hcIjogXCJmMDcwXCIsXG5cdFx0XHRcIndhcm5pbmcsZXhjbGFtYXRpb24tdHJpYW5nbGVcIjogXCJmMDcxXCIsXG5cdFx0XHRwbGFuZTogXCJmMDcyXCIsXG5cdFx0XHRjYWxlbmRhcjogXCJmMDczXCIsXG5cdFx0XHRyYW5kb206IFwiZjA3NFwiLFxuXHRcdFx0Y29tbWVudDogXCJmMDc1XCIsXG5cdFx0XHRtYWduZXQ6IFwiZjA3NlwiLFxuXHRcdFx0XCJjaGV2cm9uLXVwXCI6IFwiZjA3N1wiLFxuXHRcdFx0XCJjaGV2cm9uLWRvd25cIjogXCJmMDc4XCIsXG5cdFx0XHRyZXR3ZWV0OiBcImYwNzlcIixcblx0XHRcdFwic2hvcHBpbmctY2FydFwiOiBcImYwN2FcIixcblx0XHRcdGZvbGRlcjogXCJmMDdiXCIsXG5cdFx0XHRcImZvbGRlci1vcGVuXCI6IFwiZjA3Y1wiLFxuXHRcdFx0XCJhcnJvd3MtdlwiOiBcImYwN2RcIixcblx0XHRcdFwiYXJyb3dzLWhcIjogXCJmMDdlXCIsXG5cdFx0XHRcImJhci1jaGFydC1vLGJhci1jaGFydFwiOiBcImYwODBcIixcblx0XHRcdFwidHdpdHRlci1zcXVhcmVcIjogXCJmMDgxXCIsXG5cdFx0XHRcImZhY2Vib29rLXNxdWFyZVwiOiBcImYwODJcIixcblx0XHRcdFwiY2FtZXJhLXJldHJvXCI6IFwiZjA4M1wiLFxuXHRcdFx0a2V5OiBcImYwODRcIixcblx0XHRcdFwiZ2VhcnMsY29nc1wiOiBcImYwODVcIixcblx0XHRcdGNvbW1lbnRzOiBcImYwODZcIixcblx0XHRcdFwidGh1bWJzLW8tdXBcIjogXCJmMDg3XCIsXG5cdFx0XHRcInRodW1icy1vLWRvd25cIjogXCJmMDg4XCIsXG5cdFx0XHRcInN0YXItaGFsZlwiOiBcImYwODlcIixcblx0XHRcdFwiaGVhcnQtb1wiOiBcImYwOGFcIixcblx0XHRcdFwic2lnbi1vdXRcIjogXCJmMDhiXCIsXG5cdFx0XHRcImxpbmtlZGluLXNxdWFyZVwiOiBcImYwOGNcIixcblx0XHRcdFwidGh1bWItdGFja1wiOiBcImYwOGRcIixcblx0XHRcdFwiZXh0ZXJuYWwtbGlua1wiOiBcImYwOGVcIixcblx0XHRcdFwic2lnbi1pblwiOiBcImYwOTBcIixcblx0XHRcdHRyb3BoeTogXCJmMDkxXCIsXG5cdFx0XHRcImdpdGh1Yi1zcXVhcmVcIjogXCJmMDkyXCIsXG5cdFx0XHR1cGxvYWQ6IFwiZjA5M1wiLFxuXHRcdFx0XCJsZW1vbi1vXCI6IFwiZjA5NFwiLFxuXHRcdFx0cGhvbmU6IFwiZjA5NVwiLFxuXHRcdFx0XCJzcXVhcmUtb1wiOiBcImYwOTZcIixcblx0XHRcdFwiYm9va21hcmstb1wiOiBcImYwOTdcIixcblx0XHRcdFwicGhvbmUtc3F1YXJlXCI6IFwiZjA5OFwiLFxuXHRcdFx0dHdpdHRlcjogXCJmMDk5XCIsXG5cdFx0XHRcImZhY2Vib29rLWYsZmFjZWJvb2tcIjogXCJmMDlhXCIsXG5cdFx0XHRnaXRodWI6IFwiZjA5YlwiLFxuXHRcdFx0dW5sb2NrOiBcImYwOWNcIixcblx0XHRcdFwiY3JlZGl0LWNhcmRcIjogXCJmMDlkXCIsXG5cdFx0XHRcImZlZWQscnNzXCI6IFwiZjA5ZVwiLFxuXHRcdFx0XCJoZGQtb1wiOiBcImYwYTBcIixcblx0XHRcdGJ1bGxob3JuOiBcImYwYTFcIixcblx0XHRcdGJlbGw6IFwiZjBmM1wiLFxuXHRcdFx0Y2VydGlmaWNhdGU6IFwiZjBhM1wiLFxuXHRcdFx0XCJoYW5kLW8tcmlnaHRcIjogXCJmMGE0XCIsXG5cdFx0XHRcImhhbmQtby1sZWZ0XCI6IFwiZjBhNVwiLFxuXHRcdFx0XCJoYW5kLW8tdXBcIjogXCJmMGE2XCIsXG5cdFx0XHRcImhhbmQtby1kb3duXCI6IFwiZjBhN1wiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtbGVmdFwiOiBcImYwYThcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLXJpZ2h0XCI6IFwiZjBhOVwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtdXBcIjogXCJmMGFhXCIsXG5cdFx0XHRcImFycm93LWNpcmNsZS1kb3duXCI6IFwiZjBhYlwiLFxuXHRcdFx0Z2xvYmU6IFwiZjBhY1wiLFxuXHRcdFx0d3JlbmNoOiBcImYwYWRcIixcblx0XHRcdHRhc2tzOiBcImYwYWVcIixcblx0XHRcdGZpbHRlcjogXCJmMGIwXCIsXG5cdFx0XHRicmllZmNhc2U6IFwiZjBiMVwiLFxuXHRcdFx0XCJhcnJvd3MtYWx0XCI6IFwiZjBiMlwiLFxuXHRcdFx0XCJncm91cCx1c2Vyc1wiOiBcImYwYzBcIixcblx0XHRcdFwiY2hhaW4sbGlua1wiOiBcImYwYzFcIixcblx0XHRcdGNsb3VkOiBcImYwYzJcIixcblx0XHRcdGZsYXNrOiBcImYwYzNcIixcblx0XHRcdFwiY3V0LHNjaXNzb3JzXCI6IFwiZjBjNFwiLFxuXHRcdFx0XCJjb3B5LGZpbGVzLW9cIjogXCJmMGM1XCIsXG5cdFx0XHRwYXBlcmNsaXA6IFwiZjBjNlwiLFxuXHRcdFx0XCJzYXZlLGZsb3BweS1vXCI6IFwiZjBjN1wiLFxuXHRcdFx0c3F1YXJlOiBcImYwYzhcIixcblx0XHRcdFwibmF2aWNvbixyZW9yZGVyLGJhcnNcIjogXCJmMGM5XCIsXG5cdFx0XHRcImxpc3QtdWxcIjogXCJmMGNhXCIsXG5cdFx0XHRcImxpc3Qtb2xcIjogXCJmMGNiXCIsXG5cdFx0XHRzdHJpa2V0aHJvdWdoOiBcImYwY2NcIixcblx0XHRcdHVuZGVybGluZTogXCJmMGNkXCIsXG5cdFx0XHR0YWJsZTogXCJmMGNlXCIsXG5cdFx0XHRtYWdpYzogXCJmMGQwXCIsXG5cdFx0XHR0cnVjazogXCJmMGQxXCIsXG5cdFx0XHRwaW50ZXJlc3Q6IFwiZjBkMlwiLFxuXHRcdFx0XCJwaW50ZXJlc3Qtc3F1YXJlXCI6IFwiZjBkM1wiLFxuXHRcdFx0XCJnb29nbGUtcGx1cy1zcXVhcmVcIjogXCJmMGQ0XCIsXG5cdFx0XHRcImdvb2dsZS1wbHVzXCI6IFwiZjBkNVwiLFxuXHRcdFx0bW9uZXk6IFwiZjBkNlwiLFxuXHRcdFx0XCJjYXJldC1kb3duXCI6IFwiZjBkN1wiLFxuXHRcdFx0XCJjYXJldC11cFwiOiBcImYwZDhcIixcblx0XHRcdFwiY2FyZXQtbGVmdFwiOiBcImYwZDlcIixcblx0XHRcdFwiY2FyZXQtcmlnaHRcIjogXCJmMGRhXCIsXG5cdFx0XHRjb2x1bW5zOiBcImYwZGJcIixcblx0XHRcdFwidW5zb3J0ZWQsc29ydFwiOiBcImYwZGNcIixcblx0XHRcdFwic29ydC1kb3duLHNvcnQtZGVzY1wiOiBcImYwZGRcIixcblx0XHRcdFwic29ydC11cCxzb3J0LWFzY1wiOiBcImYwZGVcIixcblx0XHRcdGVudmVsb3BlOiBcImYwZTBcIixcblx0XHRcdGxpbmtlZGluOiBcImYwZTFcIixcblx0XHRcdFwicm90YXRlLWxlZnQsdW5kb1wiOiBcImYwZTJcIixcblx0XHRcdFwibGVnYWwsZ2F2ZWxcIjogXCJmMGUzXCIsXG5cdFx0XHRcImRhc2hib2FyZCx0YWNob21ldGVyXCI6IFwiZjBlNFwiLFxuXHRcdFx0XCJjb21tZW50LW9cIjogXCJmMGU1XCIsXG5cdFx0XHRcImNvbW1lbnRzLW9cIjogXCJmMGU2XCIsXG5cdFx0XHRcImZsYXNoLGJvbHRcIjogXCJmMGU3XCIsXG5cdFx0XHRzaXRlbWFwOiBcImYwZThcIixcblx0XHRcdHVtYnJlbGxhOiBcImYwZTlcIixcblx0XHRcdFwicGFzdGUsY2xpcGJvYXJkXCI6IFwiZjBlYVwiLFxuXHRcdFx0XCJsaWdodGJ1bGItb1wiOiBcImYwZWJcIixcblx0XHRcdGV4Y2hhbmdlOiBcImYwZWNcIixcblx0XHRcdFwiY2xvdWQtZG93bmxvYWRcIjogXCJmMGVkXCIsXG5cdFx0XHRcImNsb3VkLXVwbG9hZFwiOiBcImYwZWVcIixcblx0XHRcdFwidXNlci1tZFwiOiBcImYwZjBcIixcblx0XHRcdHN0ZXRob3Njb3BlOiBcImYwZjFcIixcblx0XHRcdHN1aXRjYXNlOiBcImYwZjJcIixcblx0XHRcdFwiYmVsbC1vXCI6IFwiZjBhMlwiLFxuXHRcdFx0Y29mZmVlOiBcImYwZjRcIixcblx0XHRcdGN1dGxlcnk6IFwiZjBmNVwiLFxuXHRcdFx0XCJmaWxlLXRleHQtb1wiOiBcImYwZjZcIixcblx0XHRcdFwiYnVpbGRpbmctb1wiOiBcImYwZjdcIixcblx0XHRcdFwiaG9zcGl0YWwtb1wiOiBcImYwZjhcIixcblx0XHRcdGFtYnVsYW5jZTogXCJmMGY5XCIsXG5cdFx0XHRtZWRraXQ6IFwiZjBmYVwiLFxuXHRcdFx0XCJmaWdodGVyLWpldFwiOiBcImYwZmJcIixcblx0XHRcdGJlZXI6IFwiZjBmY1wiLFxuXHRcdFx0XCJoLXNxdWFyZVwiOiBcImYwZmRcIixcblx0XHRcdFwicGx1cy1zcXVhcmVcIjogXCJmMGZlXCIsXG5cdFx0XHRcImFuZ2xlLWRvdWJsZS1sZWZ0XCI6IFwiZjEwMFwiLFxuXHRcdFx0XCJhbmdsZS1kb3VibGUtcmlnaHRcIjogXCJmMTAxXCIsXG5cdFx0XHRcImFuZ2xlLWRvdWJsZS11cFwiOiBcImYxMDJcIixcblx0XHRcdFwiYW5nbGUtZG91YmxlLWRvd25cIjogXCJmMTAzXCIsXG5cdFx0XHRcImFuZ2xlLWxlZnRcIjogXCJmMTA0XCIsXG5cdFx0XHRcImFuZ2xlLXJpZ2h0XCI6IFwiZjEwNVwiLFxuXHRcdFx0XCJhbmdsZS11cFwiOiBcImYxMDZcIixcblx0XHRcdFwiYW5nbGUtZG93blwiOiBcImYxMDdcIixcblx0XHRcdGRlc2t0b3A6IFwiZjEwOFwiLFxuXHRcdFx0bGFwdG9wOiBcImYxMDlcIixcblx0XHRcdHRhYmxldDogXCJmMTBhXCIsXG5cdFx0XHRcIm1vYmlsZS1waG9uZSxtb2JpbGVcIjogXCJmMTBiXCIsXG5cdFx0XHRcImNpcmNsZS1vXCI6IFwiZjEwY1wiLFxuXHRcdFx0XCJxdW90ZS1sZWZ0XCI6IFwiZjEwZFwiLFxuXHRcdFx0XCJxdW90ZS1yaWdodFwiOiBcImYxMGVcIixcblx0XHRcdHNwaW5uZXI6IFwiZjExMFwiLFxuXHRcdFx0Y2lyY2xlOiBcImYxMTFcIixcblx0XHRcdFwibWFpbC1yZXBseSxyZXBseVwiOiBcImYxMTJcIixcblx0XHRcdFwiZ2l0aHViLWFsdFwiOiBcImYxMTNcIixcblx0XHRcdFwiZm9sZGVyLW9cIjogXCJmMTE0XCIsXG5cdFx0XHRcImZvbGRlci1vcGVuLW9cIjogXCJmMTE1XCIsXG5cdFx0XHRcInNtaWxlLW9cIjogXCJmMTE4XCIsXG5cdFx0XHRcImZyb3duLW9cIjogXCJmMTE5XCIsXG5cdFx0XHRcIm1laC1vXCI6IFwiZjExYVwiLFxuXHRcdFx0Z2FtZXBhZDogXCJmMTFiXCIsXG5cdFx0XHRcImtleWJvYXJkLW9cIjogXCJmMTFjXCIsXG5cdFx0XHRcImZsYWctb1wiOiBcImYxMWRcIixcblx0XHRcdFwiZmxhZy1jaGVja2VyZWRcIjogXCJmMTFlXCIsXG5cdFx0XHR0ZXJtaW5hbDogXCJmMTIwXCIsXG5cdFx0XHRjb2RlOiBcImYxMjFcIixcblx0XHRcdFwibWFpbC1yZXBseS1hbGwscmVwbHktYWxsXCI6IFwiZjEyMlwiLFxuXHRcdFx0XCJzdGFyLWhhbGYtZW1wdHksc3Rhci1oYWxmLWZ1bGwsc3Rhci1oYWxmLW9cIjogXCJmMTIzXCIsXG5cdFx0XHRcImxvY2F0aW9uLWFycm93XCI6IFwiZjEyNFwiLFxuXHRcdFx0Y3JvcDogXCJmMTI1XCIsXG5cdFx0XHRcImNvZGUtZm9ya1wiOiBcImYxMjZcIixcblx0XHRcdFwidW5saW5rLGNoYWluLWJyb2tlblwiOiBcImYxMjdcIixcblx0XHRcdHF1ZXN0aW9uOiBcImYxMjhcIixcblx0XHRcdGluZm86IFwiZjEyOVwiLFxuXHRcdFx0ZXhjbGFtYXRpb246IFwiZjEyYVwiLFxuXHRcdFx0c3VwZXJzY3JpcHQ6IFwiZjEyYlwiLFxuXHRcdFx0c3Vic2NyaXB0OiBcImYxMmNcIixcblx0XHRcdGVyYXNlcjogXCJmMTJkXCIsXG5cdFx0XHRcInB1enpsZS1waWVjZVwiOiBcImYxMmVcIixcblx0XHRcdG1pY3JvcGhvbmU6IFwiZjEzMFwiLFxuXHRcdFx0XCJtaWNyb3Bob25lLXNsYXNoXCI6IFwiZjEzMVwiLFxuXHRcdFx0c2hpZWxkOiBcImYxMzJcIixcblx0XHRcdFwiY2FsZW5kYXItb1wiOiBcImYxMzNcIixcblx0XHRcdFwiZmlyZS1leHRpbmd1aXNoZXJcIjogXCJmMTM0XCIsXG5cdFx0XHRyb2NrZXQ6IFwiZjEzNVwiLFxuXHRcdFx0bWF4Y2RuOiBcImYxMzZcIixcblx0XHRcdFwiY2hldnJvbi1jaXJjbGUtbGVmdFwiOiBcImYxMzdcIixcblx0XHRcdFwiY2hldnJvbi1jaXJjbGUtcmlnaHRcIjogXCJmMTM4XCIsXG5cdFx0XHRcImNoZXZyb24tY2lyY2xlLXVwXCI6IFwiZjEzOVwiLFxuXHRcdFx0XCJjaGV2cm9uLWNpcmNsZS1kb3duXCI6IFwiZjEzYVwiLFxuXHRcdFx0aHRtbDU6IFwiZjEzYlwiLFxuXHRcdFx0Y3NzMzogXCJmMTNjXCIsXG5cdFx0XHRhbmNob3I6IFwiZjEzZFwiLFxuXHRcdFx0XCJ1bmxvY2stYWx0XCI6IFwiZjEzZVwiLFxuXHRcdFx0YnVsbHNleWU6IFwiZjE0MFwiLFxuXHRcdFx0XCJlbGxpcHNpcy1oXCI6IFwiZjE0MVwiLFxuXHRcdFx0XCJlbGxpcHNpcy12XCI6IFwiZjE0MlwiLFxuXHRcdFx0XCJyc3Mtc3F1YXJlXCI6IFwiZjE0M1wiLFxuXHRcdFx0XCJwbGF5LWNpcmNsZVwiOiBcImYxNDRcIixcblx0XHRcdHRpY2tldDogXCJmMTQ1XCIsXG5cdFx0XHRcIm1pbnVzLXNxdWFyZVwiOiBcImYxNDZcIixcblx0XHRcdFwibWludXMtc3F1YXJlLW9cIjogXCJmMTQ3XCIsXG5cdFx0XHRcImxldmVsLXVwXCI6IFwiZjE0OFwiLFxuXHRcdFx0XCJsZXZlbC1kb3duXCI6IFwiZjE0OVwiLFxuXHRcdFx0XCJjaGVjay1zcXVhcmVcIjogXCJmMTRhXCIsXG5cdFx0XHRcInBlbmNpbC1zcXVhcmVcIjogXCJmMTRiXCIsXG5cdFx0XHRcImV4dGVybmFsLWxpbmstc3F1YXJlXCI6IFwiZjE0Y1wiLFxuXHRcdFx0XCJzaGFyZS1zcXVhcmVcIjogXCJmMTRkXCIsXG5cdFx0XHRjb21wYXNzOiBcImYxNGVcIixcblx0XHRcdFwidG9nZ2xlLWRvd24sY2FyZXQtc3F1YXJlLW8tZG93blwiOiBcImYxNTBcIixcblx0XHRcdFwidG9nZ2xlLXVwLGNhcmV0LXNxdWFyZS1vLXVwXCI6IFwiZjE1MVwiLFxuXHRcdFx0XCJ0b2dnbGUtcmlnaHQsY2FyZXQtc3F1YXJlLW8tcmlnaHRcIjogXCJmMTUyXCIsXG5cdFx0XHRcImV1cm8sZXVyXCI6IFwiZjE1M1wiLFxuXHRcdFx0Z2JwOiBcImYxNTRcIixcblx0XHRcdFwiZG9sbGFyLHVzZFwiOiBcImYxNTVcIixcblx0XHRcdFwicnVwZWUsaW5yXCI6IFwiZjE1NlwiLFxuXHRcdFx0XCJjbnkscm1iLHllbixqcHlcIjogXCJmMTU3XCIsXG5cdFx0XHRcInJ1YmxlLHJvdWJsZSxydWJcIjogXCJmMTU4XCIsXG5cdFx0XHRcIndvbixrcndcIjogXCJmMTU5XCIsXG5cdFx0XHRcImJpdGNvaW4sYnRjXCI6IFwiZjE1YVwiLFxuXHRcdFx0ZmlsZTogXCJmMTViXCIsXG5cdFx0XHRcImZpbGUtdGV4dFwiOiBcImYxNWNcIixcblx0XHRcdFwic29ydC1hbHBoYS1hc2NcIjogXCJmMTVkXCIsXG5cdFx0XHRcInNvcnQtYWxwaGEtZGVzY1wiOiBcImYxNWVcIixcblx0XHRcdFwic29ydC1hbW91bnQtYXNjXCI6IFwiZjE2MFwiLFxuXHRcdFx0XCJzb3J0LWFtb3VudC1kZXNjXCI6IFwiZjE2MVwiLFxuXHRcdFx0XCJzb3J0LW51bWVyaWMtYXNjXCI6IFwiZjE2MlwiLFxuXHRcdFx0XCJzb3J0LW51bWVyaWMtZGVzY1wiOiBcImYxNjNcIixcblx0XHRcdFwidGh1bWJzLXVwXCI6IFwiZjE2NFwiLFxuXHRcdFx0XCJ0aHVtYnMtZG93blwiOiBcImYxNjVcIixcblx0XHRcdFwieW91dHViZS1zcXVhcmVcIjogXCJmMTY2XCIsXG5cdFx0XHR5b3V0dWJlOiBcImYxNjdcIixcblx0XHRcdHhpbmc6IFwiZjE2OFwiLFxuXHRcdFx0XCJ4aW5nLXNxdWFyZVwiOiBcImYxNjlcIixcblx0XHRcdFwieW91dHViZS1wbGF5XCI6IFwiZjE2YVwiLFxuXHRcdFx0ZHJvcGJveDogXCJmMTZiXCIsXG5cdFx0XHRcInN0YWNrLW92ZXJmbG93XCI6IFwiZjE2Y1wiLFxuXHRcdFx0aW5zdGFncmFtOiBcImYxNmRcIixcblx0XHRcdGZsaWNrcjogXCJmMTZlXCIsXG5cdFx0XHRhZG46IFwiZjE3MFwiLFxuXHRcdFx0Yml0YnVja2V0OiBcImYxNzFcIixcblx0XHRcdFwiYml0YnVja2V0LXNxdWFyZVwiOiBcImYxNzJcIixcblx0XHRcdHR1bWJscjogXCJmMTczXCIsXG5cdFx0XHRcInR1bWJsci1zcXVhcmVcIjogXCJmMTc0XCIsXG5cdFx0XHRcImxvbmctYXJyb3ctZG93blwiOiBcImYxNzVcIixcblx0XHRcdFwibG9uZy1hcnJvdy11cFwiOiBcImYxNzZcIixcblx0XHRcdFwibG9uZy1hcnJvdy1sZWZ0XCI6IFwiZjE3N1wiLFxuXHRcdFx0XCJsb25nLWFycm93LXJpZ2h0XCI6IFwiZjE3OFwiLFxuXHRcdFx0YXBwbGU6IFwiZjE3OVwiLFxuXHRcdFx0d2luZG93czogXCJmMTdhXCIsXG5cdFx0XHRhbmRyb2lkOiBcImYxN2JcIixcblx0XHRcdGxpbnV4OiBcImYxN2NcIixcblx0XHRcdGRyaWJiYmxlOiBcImYxN2RcIixcblx0XHRcdHNreXBlOiBcImYxN2VcIixcblx0XHRcdGZvdXJzcXVhcmU6IFwiZjE4MFwiLFxuXHRcdFx0dHJlbGxvOiBcImYxODFcIixcblx0XHRcdGZlbWFsZTogXCJmMTgyXCIsXG5cdFx0XHRtYWxlOiBcImYxODNcIixcblx0XHRcdFwiZ2l0dGlwLGdyYXRpcGF5XCI6IFwiZjE4NFwiLFxuXHRcdFx0XCJzdW4tb1wiOiBcImYxODVcIixcblx0XHRcdFwibW9vbi1vXCI6IFwiZjE4NlwiLFxuXHRcdFx0YXJjaGl2ZTogXCJmMTg3XCIsXG5cdFx0XHRidWc6IFwiZjE4OFwiLFxuXHRcdFx0dms6IFwiZjE4OVwiLFxuXHRcdFx0d2VpYm86IFwiZjE4YVwiLFxuXHRcdFx0cmVucmVuOiBcImYxOGJcIixcblx0XHRcdHBhZ2VsaW5lczogXCJmMThjXCIsXG5cdFx0XHRcInN0YWNrLWV4Y2hhbmdlXCI6IFwiZjE4ZFwiLFxuXHRcdFx0XCJhcnJvdy1jaXJjbGUtby1yaWdodFwiOiBcImYxOGVcIixcblx0XHRcdFwiYXJyb3ctY2lyY2xlLW8tbGVmdFwiOiBcImYxOTBcIixcblx0XHRcdFwidG9nZ2xlLWxlZnQsY2FyZXQtc3F1YXJlLW8tbGVmdFwiOiBcImYxOTFcIixcblx0XHRcdFwiZG90LWNpcmNsZS1vXCI6IFwiZjE5MlwiLFxuXHRcdFx0d2hlZWxjaGFpcjogXCJmMTkzXCIsXG5cdFx0XHRcInZpbWVvLXNxdWFyZVwiOiBcImYxOTRcIixcblx0XHRcdFwidHVya2lzaC1saXJhLHRyeVwiOiBcImYxOTVcIixcblx0XHRcdFwicGx1cy1zcXVhcmUtb1wiOiBcImYxOTZcIixcblx0XHRcdFwic3BhY2Utc2h1dHRsZVwiOiBcImYxOTdcIixcblx0XHRcdHNsYWNrOiBcImYxOThcIixcblx0XHRcdFwiZW52ZWxvcGUtc3F1YXJlXCI6IFwiZjE5OVwiLFxuXHRcdFx0d29yZHByZXNzOiBcImYxOWFcIixcblx0XHRcdG9wZW5pZDogXCJmMTliXCIsXG5cdFx0XHRcImluc3RpdHV0aW9uLGJhbmssdW5pdmVyc2l0eVwiOiBcImYxOWNcIixcblx0XHRcdFwibW9ydGFyLWJvYXJkLGdyYWR1YXRpb24tY2FwXCI6IFwiZjE5ZFwiLFxuXHRcdFx0eWFob286IFwiZjE5ZVwiLFxuXHRcdFx0Z29vZ2xlOiBcImYxYTBcIixcblx0XHRcdHJlZGRpdDogXCJmMWExXCIsXG5cdFx0XHRcInJlZGRpdC1zcXVhcmVcIjogXCJmMWEyXCIsXG5cdFx0XHRcInN0dW1ibGV1cG9uLWNpcmNsZVwiOiBcImYxYTNcIixcblx0XHRcdHN0dW1ibGV1cG9uOiBcImYxYTRcIixcblx0XHRcdGRlbGljaW91czogXCJmMWE1XCIsXG5cdFx0XHRkaWdnOiBcImYxYTZcIixcblx0XHRcdFwicGllZC1waXBlci1wcFwiOiBcImYxYTdcIixcblx0XHRcdFwicGllZC1waXBlci1hbHRcIjogXCJmMWE4XCIsXG5cdFx0XHRkcnVwYWw6IFwiZjFhOVwiLFxuXHRcdFx0am9vbWxhOiBcImYxYWFcIixcblx0XHRcdGxhbmd1YWdlOiBcImYxYWJcIixcblx0XHRcdGZheDogXCJmMWFjXCIsXG5cdFx0XHRidWlsZGluZzogXCJmMWFkXCIsXG5cdFx0XHRjaGlsZDogXCJmMWFlXCIsXG5cdFx0XHRwYXc6IFwiZjFiMFwiLFxuXHRcdFx0c3Bvb246IFwiZjFiMVwiLFxuXHRcdFx0Y3ViZTogXCJmMWIyXCIsXG5cdFx0XHRjdWJlczogXCJmMWIzXCIsXG5cdFx0XHRiZWhhbmNlOiBcImYxYjRcIixcblx0XHRcdFwiYmVoYW5jZS1zcXVhcmVcIjogXCJmMWI1XCIsXG5cdFx0XHRzdGVhbTogXCJmMWI2XCIsXG5cdFx0XHRcInN0ZWFtLXNxdWFyZVwiOiBcImYxYjdcIixcblx0XHRcdHJlY3ljbGU6IFwiZjFiOFwiLFxuXHRcdFx0XCJhdXRvbW9iaWxlLGNhclwiOiBcImYxYjlcIixcblx0XHRcdFwiY2FiLHRheGlcIjogXCJmMWJhXCIsXG5cdFx0XHR0cmVlOiBcImYxYmJcIixcblx0XHRcdHNwb3RpZnk6IFwiZjFiY1wiLFxuXHRcdFx0ZGV2aWFudGFydDogXCJmMWJkXCIsXG5cdFx0XHRzb3VuZGNsb3VkOiBcImYxYmVcIixcblx0XHRcdGRhdGFiYXNlOiBcImYxYzBcIixcblx0XHRcdFwiZmlsZS1wZGYtb1wiOiBcImYxYzFcIixcblx0XHRcdFwiZmlsZS13b3JkLW9cIjogXCJmMWMyXCIsXG5cdFx0XHRcImZpbGUtZXhjZWwtb1wiOiBcImYxYzNcIixcblx0XHRcdFwiZmlsZS1wb3dlcnBvaW50LW9cIjogXCJmMWM0XCIsXG5cdFx0XHRcImZpbGUtcGhvdG8tbyxmaWxlLXBpY3R1cmUtbyxmaWxlLWltYWdlLW9cIjogXCJmMWM1XCIsXG5cdFx0XHRcImZpbGUtemlwLW8sZmlsZS1hcmNoaXZlLW9cIjogXCJmMWM2XCIsXG5cdFx0XHRcImZpbGUtc291bmQtbyxmaWxlLWF1ZGlvLW9cIjogXCJmMWM3XCIsXG5cdFx0XHRcImZpbGUtbW92aWUtbyxmaWxlLXZpZGVvLW9cIjogXCJmMWM4XCIsXG5cdFx0XHRcImZpbGUtY29kZS1vXCI6IFwiZjFjOVwiLFxuXHRcdFx0dmluZTogXCJmMWNhXCIsXG5cdFx0XHRjb2RlcGVuOiBcImYxY2JcIixcblx0XHRcdGpzZmlkZGxlOiBcImYxY2NcIixcblx0XHRcdFwibGlmZS1ib3V5LGxpZmUtYnVveSxsaWZlLXNhdmVyLHN1cHBvcnQsbGlmZS1yaW5nXCI6IFwiZjFjZFwiLFxuXHRcdFx0XCJjaXJjbGUtby1ub3RjaFwiOiBcImYxY2VcIixcblx0XHRcdFwicmEscmVzaXN0YW5jZSxyZWJlbFwiOiBcImYxZDBcIixcblx0XHRcdFwiZ2UsZW1waXJlXCI6IFwiZjFkMVwiLFxuXHRcdFx0XCJnaXQtc3F1YXJlXCI6IFwiZjFkMlwiLFxuXHRcdFx0Z2l0OiBcImYxZDNcIixcblx0XHRcdFwieS1jb21iaW5hdG9yLXNxdWFyZSx5Yy1zcXVhcmUsaGFja2VyLW5ld3NcIjogXCJmMWQ0XCIsXG5cdFx0XHRcInRlbmNlbnQtd2VpYm9cIjogXCJmMWQ1XCIsXG5cdFx0XHRxcTogXCJmMWQ2XCIsXG5cdFx0XHRcIndlY2hhdCx3ZWl4aW5cIjogXCJmMWQ3XCIsXG5cdFx0XHRcInNlbmQscGFwZXItcGxhbmVcIjogXCJmMWQ4XCIsXG5cdFx0XHRcInNlbmQtbyxwYXBlci1wbGFuZS1vXCI6IFwiZjFkOVwiLFxuXHRcdFx0aGlzdG9yeTogXCJmMWRhXCIsXG5cdFx0XHRcImNpcmNsZS10aGluXCI6IFwiZjFkYlwiLFxuXHRcdFx0aGVhZGVyOiBcImYxZGNcIixcblx0XHRcdHBhcmFncmFwaDogXCJmMWRkXCIsXG5cdFx0XHRzbGlkZXJzOiBcImYxZGVcIixcblx0XHRcdFwic2hhcmUtYWx0XCI6IFwiZjFlMFwiLFxuXHRcdFx0XCJzaGFyZS1hbHQtc3F1YXJlXCI6IFwiZjFlMVwiLFxuXHRcdFx0Ym9tYjogXCJmMWUyXCIsXG5cdFx0XHRcInNvY2Nlci1iYWxsLW8sZnV0Ym9sLW9cIjogXCJmMWUzXCIsXG5cdFx0XHR0dHk6IFwiZjFlNFwiLFxuXHRcdFx0Ymlub2N1bGFyczogXCJmMWU1XCIsXG5cdFx0XHRwbHVnOiBcImYxZTZcIixcblx0XHRcdHNsaWRlc2hhcmU6IFwiZjFlN1wiLFxuXHRcdFx0dHdpdGNoOiBcImYxZThcIixcblx0XHRcdHllbHA6IFwiZjFlOVwiLFxuXHRcdFx0XCJuZXdzcGFwZXItb1wiOiBcImYxZWFcIixcblx0XHRcdHdpZmk6IFwiZjFlYlwiLFxuXHRcdFx0Y2FsY3VsYXRvcjogXCJmMWVjXCIsXG5cdFx0XHRwYXlwYWw6IFwiZjFlZFwiLFxuXHRcdFx0XCJnb29nbGUtd2FsbGV0XCI6IFwiZjFlZVwiLFxuXHRcdFx0XCJjYy12aXNhXCI6IFwiZjFmMFwiLFxuXHRcdFx0XCJjYy1tYXN0ZXJjYXJkXCI6IFwiZjFmMVwiLFxuXHRcdFx0XCJjYy1kaXNjb3ZlclwiOiBcImYxZjJcIixcblx0XHRcdFwiY2MtYW1leFwiOiBcImYxZjNcIixcblx0XHRcdFwiY2MtcGF5cGFsXCI6IFwiZjFmNFwiLFxuXHRcdFx0XCJjYy1zdHJpcGVcIjogXCJmMWY1XCIsXG5cdFx0XHRcImJlbGwtc2xhc2hcIjogXCJmMWY2XCIsXG5cdFx0XHRcImJlbGwtc2xhc2gtb1wiOiBcImYxZjdcIixcblx0XHRcdHRyYXNoOiBcImYxZjhcIixcblx0XHRcdGNvcHlyaWdodDogXCJmMWY5XCIsXG5cdFx0XHRhdDogXCJmMWZhXCIsXG5cdFx0XHRleWVkcm9wcGVyOiBcImYxZmJcIixcblx0XHRcdFwicGFpbnQtYnJ1c2hcIjogXCJmMWZjXCIsXG5cdFx0XHRcImJpcnRoZGF5LWNha2VcIjogXCJmMWZkXCIsXG5cdFx0XHRcImFyZWEtY2hhcnRcIjogXCJmMWZlXCIsXG5cdFx0XHRcInBpZS1jaGFydFwiOiBcImYyMDBcIixcblx0XHRcdFwibGluZS1jaGFydFwiOiBcImYyMDFcIixcblx0XHRcdGxhc3RmbTogXCJmMjAyXCIsXG5cdFx0XHRcImxhc3RmbS1zcXVhcmVcIjogXCJmMjAzXCIsXG5cdFx0XHRcInRvZ2dsZS1vZmZcIjogXCJmMjA0XCIsXG5cdFx0XHRcInRvZ2dsZS1vblwiOiBcImYyMDVcIixcblx0XHRcdGJpY3ljbGU6IFwiZjIwNlwiLFxuXHRcdFx0YnVzOiBcImYyMDdcIixcblx0XHRcdGlveGhvc3Q6IFwiZjIwOFwiLFxuXHRcdFx0YW5nZWxsaXN0OiBcImYyMDlcIixcblx0XHRcdGNjOiBcImYyMGFcIixcblx0XHRcdFwic2hla2VsLHNoZXFlbCxpbHNcIjogXCJmMjBiXCIsXG5cdFx0XHRtZWFucGF0aDogXCJmMjBjXCIsXG5cdFx0XHRidXlzZWxsYWRzOiBcImYyMGRcIixcblx0XHRcdGNvbm5lY3RkZXZlbG9wOiBcImYyMGVcIixcblx0XHRcdGRhc2hjdWJlOiBcImYyMTBcIixcblx0XHRcdGZvcnVtYmVlOiBcImYyMTFcIixcblx0XHRcdGxlYW5wdWI6IFwiZjIxMlwiLFxuXHRcdFx0c2VsbHN5OiBcImYyMTNcIixcblx0XHRcdHNoaXJ0c2luYnVsazogXCJmMjE0XCIsXG5cdFx0XHRzaW1wbHlidWlsdDogXCJmMjE1XCIsXG5cdFx0XHRza3lhdGxhczogXCJmMjE2XCIsXG5cdFx0XHRcImNhcnQtcGx1c1wiOiBcImYyMTdcIixcblx0XHRcdFwiY2FydC1hcnJvdy1kb3duXCI6IFwiZjIxOFwiLFxuXHRcdFx0ZGlhbW9uZDogXCJmMjE5XCIsXG5cdFx0XHRzaGlwOiBcImYyMWFcIixcblx0XHRcdFwidXNlci1zZWNyZXRcIjogXCJmMjFiXCIsXG5cdFx0XHRtb3RvcmN5Y2xlOiBcImYyMWNcIixcblx0XHRcdFwic3RyZWV0LXZpZXdcIjogXCJmMjFkXCIsXG5cdFx0XHRoZWFydGJlYXQ6IFwiZjIxZVwiLFxuXHRcdFx0dmVudXM6IFwiZjIyMVwiLFxuXHRcdFx0bWFyczogXCJmMjIyXCIsXG5cdFx0XHRtZXJjdXJ5OiBcImYyMjNcIixcblx0XHRcdFwiaW50ZXJzZXgsdHJhbnNnZW5kZXJcIjogXCJmMjI0XCIsXG5cdFx0XHRcInRyYW5zZ2VuZGVyLWFsdFwiOiBcImYyMjVcIixcblx0XHRcdFwidmVudXMtZG91YmxlXCI6IFwiZjIyNlwiLFxuXHRcdFx0XCJtYXJzLWRvdWJsZVwiOiBcImYyMjdcIixcblx0XHRcdFwidmVudXMtbWFyc1wiOiBcImYyMjhcIixcblx0XHRcdFwibWFycy1zdHJva2VcIjogXCJmMjI5XCIsXG5cdFx0XHRcIm1hcnMtc3Ryb2tlLXZcIjogXCJmMjJhXCIsXG5cdFx0XHRcIm1hcnMtc3Ryb2tlLWhcIjogXCJmMjJiXCIsXG5cdFx0XHRuZXV0ZXI6IFwiZjIyY1wiLFxuXHRcdFx0Z2VuZGVybGVzczogXCJmMjJkXCIsXG5cdFx0XHRcImZhY2Vib29rLW9mZmljaWFsXCI6IFwiZjIzMFwiLFxuXHRcdFx0XCJwaW50ZXJlc3QtcFwiOiBcImYyMzFcIixcblx0XHRcdHdoYXRzYXBwOiBcImYyMzJcIixcblx0XHRcdHNlcnZlcjogXCJmMjMzXCIsXG5cdFx0XHRcInVzZXItcGx1c1wiOiBcImYyMzRcIixcblx0XHRcdFwidXNlci10aW1lc1wiOiBcImYyMzVcIixcblx0XHRcdFwiaG90ZWwsYmVkXCI6IFwiZjIzNlwiLFxuXHRcdFx0dmlhY29pbjogXCJmMjM3XCIsXG5cdFx0XHR0cmFpbjogXCJmMjM4XCIsXG5cdFx0XHRzdWJ3YXk6IFwiZjIzOVwiLFxuXHRcdFx0bWVkaXVtOiBcImYyM2FcIixcblx0XHRcdFwieWMseS1jb21iaW5hdG9yXCI6IFwiZjIzYlwiLFxuXHRcdFx0XCJvcHRpbi1tb25zdGVyXCI6IFwiZjIzY1wiLFxuXHRcdFx0b3BlbmNhcnQ6IFwiZjIzZFwiLFxuXHRcdFx0ZXhwZWRpdGVkc3NsOiBcImYyM2VcIixcblx0XHRcdFwiYmF0dGVyeS00LGJhdHRlcnktZnVsbFwiOiBcImYyNDBcIixcblx0XHRcdFwiYmF0dGVyeS0zLGJhdHRlcnktdGhyZWUtcXVhcnRlcnNcIjogXCJmMjQxXCIsXG5cdFx0XHRcImJhdHRlcnktMixiYXR0ZXJ5LWhhbGZcIjogXCJmMjQyXCIsXG5cdFx0XHRcImJhdHRlcnktMSxiYXR0ZXJ5LXF1YXJ0ZXJcIjogXCJmMjQzXCIsXG5cdFx0XHRcImJhdHRlcnktMCxiYXR0ZXJ5LWVtcHR5XCI6IFwiZjI0NFwiLFxuXHRcdFx0XCJtb3VzZS1wb2ludGVyXCI6IFwiZjI0NVwiLFxuXHRcdFx0XCJpLWN1cnNvclwiOiBcImYyNDZcIixcblx0XHRcdFwib2JqZWN0LWdyb3VwXCI6IFwiZjI0N1wiLFxuXHRcdFx0XCJvYmplY3QtdW5ncm91cFwiOiBcImYyNDhcIixcblx0XHRcdFwic3RpY2t5LW5vdGVcIjogXCJmMjQ5XCIsXG5cdFx0XHRcInN0aWNreS1ub3RlLW9cIjogXCJmMjRhXCIsXG5cdFx0XHRcImNjLWpjYlwiOiBcImYyNGJcIixcblx0XHRcdFwiY2MtZGluZXJzLWNsdWJcIjogXCJmMjRjXCIsXG5cdFx0XHRjbG9uZTogXCJmMjRkXCIsXG5cdFx0XHRcImJhbGFuY2Utc2NhbGVcIjogXCJmMjRlXCIsXG5cdFx0XHRcImhvdXJnbGFzcy1vXCI6IFwiZjI1MFwiLFxuXHRcdFx0XCJob3VyZ2xhc3MtMSxob3VyZ2xhc3Mtc3RhcnRcIjogXCJmMjUxXCIsXG5cdFx0XHRcImhvdXJnbGFzcy0yLGhvdXJnbGFzcy1oYWxmXCI6IFwiZjI1MlwiLFxuXHRcdFx0XCJob3VyZ2xhc3MtMyxob3VyZ2xhc3MtZW5kXCI6IFwiZjI1M1wiLFxuXHRcdFx0aG91cmdsYXNzOiBcImYyNTRcIixcblx0XHRcdFwiaGFuZC1ncmFiLW8saGFuZC1yb2NrLW9cIjogXCJmMjU1XCIsXG5cdFx0XHRcImhhbmQtc3RvcC1vLGhhbmQtcGFwZXItb1wiOiBcImYyNTZcIixcblx0XHRcdFwiaGFuZC1zY2lzc29ycy1vXCI6IFwiZjI1N1wiLFxuXHRcdFx0XCJoYW5kLWxpemFyZC1vXCI6IFwiZjI1OFwiLFxuXHRcdFx0XCJoYW5kLXNwb2NrLW9cIjogXCJmMjU5XCIsXG5cdFx0XHRcImhhbmQtcG9pbnRlci1vXCI6IFwiZjI1YVwiLFxuXHRcdFx0XCJoYW5kLXBlYWNlLW9cIjogXCJmMjViXCIsXG5cdFx0XHR0cmFkZW1hcms6IFwiZjI1Y1wiLFxuXHRcdFx0cmVnaXN0ZXJlZDogXCJmMjVkXCIsXG5cdFx0XHRcImNyZWF0aXZlLWNvbW1vbnNcIjogXCJmMjVlXCIsXG5cdFx0XHRnZzogXCJmMjYwXCIsXG5cdFx0XHRcImdnLWNpcmNsZVwiOiBcImYyNjFcIixcblx0XHRcdHRyaXBhZHZpc29yOiBcImYyNjJcIixcblx0XHRcdG9kbm9rbGFzc25pa2k6IFwiZjI2M1wiLFxuXHRcdFx0XCJvZG5va2xhc3NuaWtpLXNxdWFyZVwiOiBcImYyNjRcIixcblx0XHRcdFwiZ2V0LXBvY2tldFwiOiBcImYyNjVcIixcblx0XHRcdFwid2lraXBlZGlhLXdcIjogXCJmMjY2XCIsXG5cdFx0XHRzYWZhcmk6IFwiZjI2N1wiLFxuXHRcdFx0Y2hyb21lOiBcImYyNjhcIixcblx0XHRcdGZpcmVmb3g6IFwiZjI2OVwiLFxuXHRcdFx0b3BlcmE6IFwiZjI2YVwiLFxuXHRcdFx0XCJpbnRlcm5ldC1leHBsb3JlclwiOiBcImYyNmJcIixcblx0XHRcdFwidHYsdGVsZXZpc2lvblwiOiBcImYyNmNcIixcblx0XHRcdGNvbnRhbzogXCJmMjZkXCIsXG5cdFx0XHRcIjUwMHB4XCI6IFwiZjI2ZVwiLFxuXHRcdFx0YW1hem9uOiBcImYyNzBcIixcblx0XHRcdFwiY2FsZW5kYXItcGx1cy1vXCI6IFwiZjI3MVwiLFxuXHRcdFx0XCJjYWxlbmRhci1taW51cy1vXCI6IFwiZjI3MlwiLFxuXHRcdFx0XCJjYWxlbmRhci10aW1lcy1vXCI6IFwiZjI3M1wiLFxuXHRcdFx0XCJjYWxlbmRhci1jaGVjay1vXCI6IFwiZjI3NFwiLFxuXHRcdFx0aW5kdXN0cnk6IFwiZjI3NVwiLFxuXHRcdFx0XCJtYXAtcGluXCI6IFwiZjI3NlwiLFxuXHRcdFx0XCJtYXAtc2lnbnNcIjogXCJmMjc3XCIsXG5cdFx0XHRcIm1hcC1vXCI6IFwiZjI3OFwiLFxuXHRcdFx0bWFwOiBcImYyNzlcIixcblx0XHRcdGNvbW1lbnRpbmc6IFwiZjI3YVwiLFxuXHRcdFx0XCJjb21tZW50aW5nLW9cIjogXCJmMjdiXCIsXG5cdFx0XHRob3V6ejogXCJmMjdjXCIsXG5cdFx0XHR2aW1lbzogXCJmMjdkXCIsXG5cdFx0XHRcImJsYWNrLXRpZVwiOiBcImYyN2VcIixcblx0XHRcdGZvbnRpY29uczogXCJmMjgwXCIsXG5cdFx0XHRcInJlZGRpdC1hbGllblwiOiBcImYyODFcIixcblx0XHRcdGVkZ2U6IFwiZjI4MlwiLFxuXHRcdFx0XCJjcmVkaXQtY2FyZC1hbHRcIjogXCJmMjgzXCIsXG5cdFx0XHRjb2RpZXBpZTogXCJmMjg0XCIsXG5cdFx0XHRtb2R4OiBcImYyODVcIixcblx0XHRcdFwiZm9ydC1hd2Vzb21lXCI6IFwiZjI4NlwiLFxuXHRcdFx0dXNiOiBcImYyODdcIixcblx0XHRcdFwicHJvZHVjdC1odW50XCI6IFwiZjI4OFwiLFxuXHRcdFx0bWl4Y2xvdWQ6IFwiZjI4OVwiLFxuXHRcdFx0c2NyaWJkOiBcImYyOGFcIixcblx0XHRcdFwicGF1c2UtY2lyY2xlXCI6IFwiZjI4YlwiLFxuXHRcdFx0XCJwYXVzZS1jaXJjbGUtb1wiOiBcImYyOGNcIixcblx0XHRcdFwic3RvcC1jaXJjbGVcIjogXCJmMjhkXCIsXG5cdFx0XHRcInN0b3AtY2lyY2xlLW9cIjogXCJmMjhlXCIsXG5cdFx0XHRcInNob3BwaW5nLWJhZ1wiOiBcImYyOTBcIixcblx0XHRcdFwic2hvcHBpbmctYmFza2V0XCI6IFwiZjI5MVwiLFxuXHRcdFx0aGFzaHRhZzogXCJmMjkyXCIsXG5cdFx0XHRibHVldG9vdGg6IFwiZjI5M1wiLFxuXHRcdFx0XCJibHVldG9vdGgtYlwiOiBcImYyOTRcIixcblx0XHRcdHBlcmNlbnQ6IFwiZjI5NVwiLFxuXHRcdFx0Z2l0bGFiOiBcImYyOTZcIixcblx0XHRcdHdwYmVnaW5uZXI6IFwiZjI5N1wiLFxuXHRcdFx0d3Bmb3JtczogXCJmMjk4XCIsXG5cdFx0XHRlbnZpcmE6IFwiZjI5OVwiLFxuXHRcdFx0XCJ1bml2ZXJzYWwtYWNjZXNzXCI6IFwiZjI5YVwiLFxuXHRcdFx0XCJ3aGVlbGNoYWlyLWFsdFwiOiBcImYyOWJcIixcblx0XHRcdFwicXVlc3Rpb24tY2lyY2xlLW9cIjogXCJmMjljXCIsXG5cdFx0XHRibGluZDogXCJmMjlkXCIsXG5cdFx0XHRcImF1ZGlvLWRlc2NyaXB0aW9uXCI6IFwiZjI5ZVwiLFxuXHRcdFx0XCJ2b2x1bWUtY29udHJvbC1waG9uZVwiOiBcImYyYTBcIixcblx0XHRcdGJyYWlsbGU6IFwiZjJhMVwiLFxuXHRcdFx0XCJhc3Npc3RpdmUtbGlzdGVuaW5nLXN5c3RlbXNcIjogXCJmMmEyXCIsXG5cdFx0XHRcImFzbC1pbnRlcnByZXRpbmcsYW1lcmljYW4tc2lnbi1sYW5ndWFnZS1pbnRlcnByZXRpbmdcIjogXCJmMmEzXCIsXG5cdFx0XHRcImRlYWZuZXNzLGhhcmQtb2YtaGVhcmluZyxkZWFmXCI6IFwiZjJhNFwiLFxuXHRcdFx0Z2xpZGU6IFwiZjJhNVwiLFxuXHRcdFx0XCJnbGlkZS1nXCI6IFwiZjJhNlwiLFxuXHRcdFx0XCJzaWduaW5nLHNpZ24tbGFuZ3VhZ2VcIjogXCJmMmE3XCIsXG5cdFx0XHRcImxvdy12aXNpb25cIjogXCJmMmE4XCIsXG5cdFx0XHR2aWFkZW86IFwiZjJhOVwiLFxuXHRcdFx0XCJ2aWFkZW8tc3F1YXJlXCI6IFwiZjJhYVwiLFxuXHRcdFx0c25hcGNoYXQ6IFwiZjJhYlwiLFxuXHRcdFx0XCJzbmFwY2hhdC1naG9zdFwiOiBcImYyYWNcIixcblx0XHRcdFwic25hcGNoYXQtc3F1YXJlXCI6IFwiZjJhZFwiLFxuXHRcdFx0XCJwaWVkLXBpcGVyXCI6IFwiZjJhZVwiLFxuXHRcdFx0XCJmaXJzdC1vcmRlclwiOiBcImYyYjBcIixcblx0XHRcdHlvYXN0OiBcImYyYjFcIixcblx0XHRcdHRoZW1laXNsZTogXCJmMmIyXCIsXG5cdFx0XHRcImdvb2dsZS1wbHVzLWNpcmNsZSxnb29nbGUtcGx1cy1vZmZpY2lhbFwiOiBcImYyYjNcIixcblx0XHRcdFwiZmEsZm9udC1hd2Vzb21lXCI6IFwiZjJiNFwiXG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIGljb24oZCkge1xuXHRcdGxldCBjb2RlO1xuXG5cdFx0aWYgKG9wdGlvbnMuaWNvbk1hcCAmJiBvcHRpb25zLnNob3dJY29ucyAmJiBvcHRpb25zLmljb25zKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0gJiYgb3B0aW9ucy5pY29uTWFwW29wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dXSkge1xuXHRcdFx0XHRjb2RlID0gb3B0aW9ucy5pY29uTWFwW29wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dXTtcblx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy5pY29uTWFwW2QubGFiZWxzWzBdXSkge1xuXHRcdFx0XHRjb2RlID0gb3B0aW9ucy5pY29uTWFwW2QubGFiZWxzWzBdXTtcblx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy5pY29uc1tkLmxhYmVsc1swXV0pIHtcblx0XHRcdFx0Y29kZSA9IG9wdGlvbnMuaWNvbnNbZC5sYWJlbHNbMF1dO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBjb2RlO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW1hZ2UoZCkge1xuXHRcdGxldCBpbWFnZXNGb3JMYWJlbCwgaW1nLCBpbWdMZXZlbCwgbGFiZWwsIGxhYmVsUHJvcGVydHlWYWx1ZSwgcHJvcGVydHksIHZhbHVlO1xuXG5cdFx0aWYgKG9wdGlvbnMuaW1hZ2VzKSB7XG5cdFx0XHRpbWFnZXNGb3JMYWJlbCA9IG9wdGlvbnMuaW1hZ2VNYXBbZC5sYWJlbHNbMF1dO1xuXG5cdFx0XHRpZiAoaW1hZ2VzRm9yTGFiZWwpIHtcblx0XHRcdFx0aW1nTGV2ZWwgPSAwO1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VzRm9yTGFiZWwubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRsYWJlbFByb3BlcnR5VmFsdWUgPSBpbWFnZXNGb3JMYWJlbFtpXS5zcGxpdChcInxcIik7XG5cblx0XHRcdFx0XHRzd2l0Y2ggKGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdGNhc2UgMzpcblx0XHRcdFx0XHRcdFx0dmFsdWUgPSBsYWJlbFByb3BlcnR5VmFsdWVbMl07XG5cdFx0XHRcdFx0XHQvKiBmYWxscyB0aHJvdWdoICovXG5cdFx0XHRcdFx0XHRjYXNlIDI6XG5cdFx0XHRcdFx0XHRcdHByb3BlcnR5ID0gbGFiZWxQcm9wZXJ0eVZhbHVlWzFdO1xuXHRcdFx0XHRcdFx0LyogZmFsbHMgdGhyb3VnaCAqL1xuXHRcdFx0XHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHRcdFx0XHRsYWJlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZVswXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0XHRkLmxhYmVsc1swXSA9PT0gbGFiZWwgJiZcblx0XHRcdFx0XHRcdCghcHJvcGVydHkgfHwgZC5wcm9wZXJ0aWVzW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkKSAmJlxuXHRcdFx0XHRcdFx0KCF2YWx1ZSB8fCBkLnByb3BlcnRpZXNbcHJvcGVydHldID09PSB2YWx1ZSlcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdGlmIChsYWJlbFByb3BlcnR5VmFsdWUubGVuZ3RoID4gaW1nTGV2ZWwpIHtcblx0XHRcdFx0XHRcdFx0aW1nID0gb3B0aW9ucy5pbWFnZXNbaW1hZ2VzRm9yTGFiZWxbaV1dO1xuXHRcdFx0XHRcdFx0XHRpbWdMZXZlbCA9IGxhYmVsUHJvcGVydHlWYWx1ZS5sZW5ndGg7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGltZztcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXQoX3NlbGVjdG9yLCBfb3B0aW9ucykge1xuXHRcdGluaXRJY29uTWFwKCk7XG5cblx0XHRtZXJnZShvcHRpb25zLCBfb3B0aW9ucyk7XG5cblx0XHRpZiAob3B0aW9ucy5pY29ucykge1xuXHRcdFx0b3B0aW9ucy5zaG93SWNvbnMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICghb3B0aW9ucy5taW5Db2xsaXNpb24pIHtcblx0XHRcdG9wdGlvbnMubWluQ29sbGlzaW9uID0gb3B0aW9ucy5ub2RlUmFkaXVzICogMjtcblx0XHR9XG5cblx0XHRpbml0SW1hZ2VNYXAoKTtcblxuXHRcdHNlbGVjdG9yID0gX3NlbGVjdG9yO1xuXHRcdGNvbnRhaW5lciA9IGQzLnNlbGVjdChzZWxlY3Rvcik7XG5cdFx0Y29udGFpbmVyLmF0dHIoXCJjbGFzc1wiLCBcIm5lbzRqZDNcIikuaHRtbChcIlwiKTtcblxuXHRcdGlmIChvcHRpb25zLmluZm9QYW5lbCkge1xuXHRcdFx0aW5mbyA9IGFwcGVuZEluZm9QYW5lbChjb250YWluZXIpO1xuXHRcdH1cblxuXHRcdGFwcGVuZEdyYXBoKGNvbnRhaW5lcik7XG5cdFx0c2ltdWxhdGlvbiA9IGluaXRTaW11bGF0aW9uKCk7XG5cblx0XHRpZiAob3B0aW9ucy5uZW80akRhdGEpIHtcblx0XHRcdGxvYWROZW80akRhdGEob3B0aW9ucy5uZW80akRhdGEpO1xuXHRcdH0gZWxzZSBpZiAob3B0aW9ucy5uZW80akRhdGFVcmwpIHtcblx0XHRcdGxvYWROZW80akRhdGFGcm9tVXJsKG9wdGlvbnMubmVvNGpEYXRhVXJsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIkVycm9yOiBib3RoIG5lbzRqRGF0YSBhbmQgbmVvNGpEYXRhVXJsIGFyZSBlbXB0eSFcIik7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdEljb25NYXAoKSB7XG5cdFx0T2JqZWN0LmtleXMob3B0aW9ucy5pY29uTWFwKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdGNvbnN0IGtleXMgPSBrZXkuc3BsaXQoXCIsXCIpO1xuXHRcdFx0Y29uc3QgdmFsdWUgPSBvcHRpb25zLmljb25NYXBba2V5XTtcblxuXHRcdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdFx0b3B0aW9ucy5pY29uTWFwW2tleV0gPSB2YWx1ZTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdEltYWdlTWFwKCkge1xuXHRcdGxldCBrZXlzO1xuXG5cdFx0Zm9yIChjb25zdCBrZXkgaW4gb3B0aW9ucy5pbWFnZXMpIHtcblx0XHRcdGlmIChvcHRpb25zLmltYWdlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGtleXMgPSBrZXkuc3BsaXQoXCJ8XCIpO1xuXG5cdFx0XHRcdGlmICghb3B0aW9ucy5pbWFnZU1hcFtrZXlzWzBdXSkge1xuXHRcdFx0XHRcdG9wdGlvbnMuaW1hZ2VNYXBba2V5c1swXV0gPSBba2V5XTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvcHRpb25zLmltYWdlTWFwW2tleXNbMF1dLnB1c2goa2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGluaXRTaW11bGF0aW9uKCkge1xuXHRcdGNvbnN0IHNpbXVsYXRpb24gPSBkM1xuXHRcdFx0LmZvcmNlU2ltdWxhdGlvbigpXG5cdFx0XHQuZm9yY2UoXG5cdFx0XHRcdFwiY29sbGlkZVwiLFxuXHRcdFx0XHRkM1xuXHRcdFx0XHRcdC5mb3JjZUNvbGxpZGUoKVxuXHRcdFx0XHRcdC5yYWRpdXMoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBvcHRpb25zLm1pbkNvbGxpc2lvbjtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5pdGVyYXRpb25zKDIpXG5cdFx0XHQpXG5cdFx0XHQuZm9yY2UoXCJjaGFyZ2VcIiwgZDMuZm9yY2VNYW55Qm9keSgpKVxuXHRcdFx0LmZvcmNlKFxuXHRcdFx0XHRcImxpbmtcIixcblx0XHRcdFx0ZDMuZm9yY2VMaW5rKCkuaWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5pZDtcblx0XHRcdFx0fSlcblx0XHRcdClcblx0XHRcdC5mb3JjZShcblx0XHRcdFx0XCJjZW50ZXJcIixcblx0XHRcdFx0ZDMuZm9yY2VDZW50ZXIoXG5cdFx0XHRcdFx0c3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQuY2xpZW50V2lkdGggLyAyLFxuXHRcdFx0XHRcdHN2Zy5ub2RlKCkucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAvIDJcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdFx0Lm9uKFwidGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHRpY2soKTtcblx0XHRcdH0pXG5cdFx0XHQub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAob3B0aW9ucy56b29tRml0ICYmICFqdXN0TG9hZGVkKSB7XG5cdFx0XHRcdFx0anVzdExvYWRlZCA9IHRydWU7XG5cdFx0XHRcdFx0em9vbUZpdCgyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRyZXR1cm4gc2ltdWxhdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGEoKSB7XG5cdFx0bm9kZXMgPSBbXTtcblx0XHRyZWxhdGlvbnNoaXBzID0gW107XG5cblx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKG9wdGlvbnMubmVvNGpEYXRhKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGxvYWROZW80akRhdGFGcm9tVXJsKG5lbzRqRGF0YVVybCkge1xuXHRcdG5vZGVzID0gW107XG5cdFx0cmVsYXRpb25zaGlwcyA9IFtdO1xuXG5cdFx0ZDMuanNvbihuZW80akRhdGFVcmwpXG5cdFx0XHQudGhlbigoZGF0YSkgPT4ge1xuXHRcdFx0XHR1cGRhdGVXaXRoTmVvNGpEYXRhKGRhdGEpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHRhcmdldCwgc291cmNlKSB7XG5cdFx0T2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0dGFyZ2V0W3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBuZW80akRhdGFUb0QzRGF0YShkYXRhKSB7XG5cdFx0Y29uc3QgZ3JhcGggPSB7XG5cdFx0XHRub2RlczogW10sXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBbXVxuXHRcdH07XG5cblx0XHRkYXRhLnJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAocmVzdWx0KSB7XG5cdFx0XHRyZXN1bHQuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRcdGRhdGEuZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0XHRcdGlmICghY29udGFpbnMoZ3JhcGgubm9kZXMsIG5vZGUuaWQpKSB7XG5cdFx0XHRcdFx0XHRncmFwaC5ub2Rlcy5wdXNoKG5vZGUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmZvckVhY2goZnVuY3Rpb24gKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC5zb3VyY2UgPSByZWxhdGlvbnNoaXAuc3RhcnROb2RlO1xuXHRcdFx0XHRcdHJlbGF0aW9uc2hpcC50YXJnZXQgPSByZWxhdGlvbnNoaXAuZW5kTm9kZTtcblx0XHRcdFx0XHRncmFwaC5yZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdFx0XHRpZiAoYS5zb3VyY2UgPiBiLnNvdXJjZSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChhLnNvdXJjZSA8IGIuc291cmNlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gLTE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmIChhLnRhcmdldCA+IGIudGFyZ2V0KSB7IHJldHVybiAxOyB9XG5cdFx0XHRcdFx0XHRyZXR1cm4gYS50YXJnZXQgPCBiLnRhcmdldCA/IC0xIDogMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0aSAhPT0gMCAmJlxuXHRcdFx0XHRcdFx0ZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2ldLnNvdXJjZSA9PT0gZGF0YS5ncmFwaC5yZWxhdGlvbnNoaXBzW2kgLSAxXS5zb3VyY2UgJiZcblx0XHRcdFx0XHRcdGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS50YXJnZXQgPT09IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0udGFyZ2V0XG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRkYXRhLmdyYXBoLnJlbGF0aW9uc2hpcHNbaV0ubGlua251bSA9IGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpIC0gMV0ubGlua251bSArIDE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGEuZ3JhcGgucmVsYXRpb25zaGlwc1tpXS5saW5rbnVtID0gMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGdyYXBoO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmFuZG9tRDNEYXRhKGQsIG1heE5vZGVzVG9HZW5lcmF0ZSkge1xuXHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRub2RlczogW10sXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiBbXVxuXHRcdH07XG5cdFx0Y29uc3QgbnVtTm9kZXMgPSAoKG1heE5vZGVzVG9HZW5lcmF0ZSAqIE1hdGgucmFuZG9tKCkpIDw8IDApICsgMTtcblx0XHRjb25zdCBzID0gc2l6ZSgpO1xuXG5cdFx0bGV0IHJlbGF0aW9uc2hpcDtcblx0XHRsZXQgbGFiZWw7XG5cdFx0bGV0IG5vZGU7XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IG51bU5vZGVzOyBpKyspIHtcblx0XHRcdGxhYmVsID0gcmFuZG9tTGFiZWwoKTtcblxuXHRcdFx0bm9kZSA9IHtcblx0XHRcdFx0aWQ6IHMubm9kZXMgKyAxICsgaSxcblx0XHRcdFx0bGFiZWxzOiBbbGFiZWxdLFxuXHRcdFx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdFx0cmFuZG9tOiBsYWJlbFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR4OiBkLngsXG5cdFx0XHRcdHk6IGQueVxuXHRcdFx0fTtcblxuXHRcdFx0ZGF0YS5ub2Rlc1tkYXRhLm5vZGVzLmxlbmd0aF0gPSBub2RlO1xuXG5cdFx0XHRyZWxhdGlvbnNoaXAgPSB7XG5cdFx0XHRcdGlkOiBzLnJlbGF0aW9uc2hpcHMgKyAxICsgaSxcblx0XHRcdFx0dHlwZTogbGFiZWwudG9VcHBlckNhc2UoKSxcblx0XHRcdFx0c3RhcnROb2RlOiBkLmlkLFxuXHRcdFx0XHRlbmROb2RlOiBzLm5vZGVzICsgMSArIGksXG5cdFx0XHRcdHByb3BlcnRpZXM6IHtcblx0XHRcdFx0XHRmcm9tOiBEYXRlLm5vdygpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNvdXJjZTogZC5pZCxcblx0XHRcdFx0dGFyZ2V0OiBzLm5vZGVzICsgMSArIGksXG5cdFx0XHRcdGxpbmtudW06IHMucmVsYXRpb25zaGlwcyArIDEgKyBpXG5cdFx0XHR9O1xuXG5cdFx0XHRkYXRhLnJlbGF0aW9uc2hpcHNbZGF0YS5yZWxhdGlvbnNoaXBzLmxlbmd0aF0gPSByZWxhdGlvbnNoaXA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRhdGE7XG5cdH1cblxuXHRmdW5jdGlvbiByYW5kb21MYWJlbCgpIHtcblx0XHRjb25zdCBpY29ucyA9IE9iamVjdC5rZXlzKG9wdGlvbnMuaWNvbk1hcCk7XG5cdFx0cmV0dXJuIGljb25zWyhpY29ucy5sZW5ndGggKiBNYXRoLnJhbmRvbSgpKSA8PCAwXTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJlc2V0V2l0aE5lbzRqRGF0YShuZW80akRhdGEpIHtcblx0XHQvLyBDYWxsIHRoZSBpbml0IG1ldGhvZCBhZ2FpbiB3aXRoIG5ldyBkYXRhXG5cdFx0Y29uc3QgbmV3T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oX29wdGlvbnMsIHtcblx0XHRcdG5lbzRqRGF0YTogbmVvNGpEYXRhLFxuXHRcdFx0bmVvNGpEYXRhVXJsOiB1bmRlZmluZWRcblx0XHR9KTtcblx0XHRpbml0KF9zZWxlY3RvciwgbmV3T3B0aW9ucyk7XG5cdH1cblxuXHRmdW5jdGlvbiByb3RhdGUoY3gsIGN5LCB4LCB5LCBhbmdsZSkge1xuXHRcdGNvbnN0IHJhZGlhbnMgPSAoTWF0aC5QSSAvIDE4MCkgKiBhbmdsZTtcblx0XHRjb25zdCBjb3MgPSBNYXRoLmNvcyhyYWRpYW5zKTtcblx0XHRjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcblx0XHRjb25zdCBueCA9IGNvcyAqICh4IC0gY3gpICsgc2luICogKHkgLSBjeSkgKyBjeDtcblx0XHRjb25zdCBueSA9IGNvcyAqICh5IC0gY3kpIC0gc2luICogKHggLSBjeCkgKyBjeTtcblxuXHRcdHJldHVybiB7IHg6IG54LCB5OiBueSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gcm90YXRlUG9pbnQoYywgcCwgYW5nbGUpIHtcblx0XHRyZXR1cm4gcm90YXRlKGMueCwgYy55LCBwLngsIHAueSwgYW5nbGUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcm90YXRpb24oc291cmNlLCB0YXJnZXQpIHtcblx0XHRyZXR1cm4gKE1hdGguYXRhbjIodGFyZ2V0LnkgLSBzb3VyY2UueSwgdGFyZ2V0LnggLSBzb3VyY2UueCkgKiAxODApIC8gTWF0aC5QSTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNpemUoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG5vZGVzOiBub2Rlcy5sZW5ndGgsXG5cdFx0XHRyZWxhdGlvbnNoaXBzOiByZWxhdGlvbnNoaXBzLmxlbmd0aFxuXHRcdH07XG5cdH1cblxuXHRmdW5jdGlvbiBzdGlja05vZGUoZCkge1xuXHRcdGQuZnggPSBkLng7XG5cdFx0ZC5meSA9IGQueTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2soKSB7XG5cdFx0dGlja05vZGVzKCk7XG5cdFx0dGlja1JlbGF0aW9uc2hpcHMoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRpY2tOb2RlcygpIHtcblx0XHRpZiAobm9kZSkge1xuXHRcdFx0bm9kZS5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLCBcIiArIGQueSArIFwiKVwiO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHMoKSB7XG5cdFx0aWYgKHJlbGF0aW9uc2hpcCkge1xuXHRcdFx0cmVsYXRpb25zaGlwLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0Y29uc3QgYW5nbGUgPSByb3RhdGlvbihkLnNvdXJjZSwgZC50YXJnZXQpO1xuXHRcdFx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnNvdXJjZS54ICsgXCIsIFwiICsgZC5zb3VyY2UueSArIFwiKSByb3RhdGUoXCIgKyBhbmdsZSArIFwiKVwiO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRpY2tSZWxhdGlvbnNoaXBzVGV4dHMoKTtcblx0XHRcdHRpY2tSZWxhdGlvbnNoaXBzT3V0bGluZXMoKTtcblx0XHRcdHRpY2tSZWxhdGlvbnNoaXBzT3ZlcmxheXMoKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc091dGxpbmVzKCkge1xuXHRcdHJlbGF0aW9uc2hpcC5lYWNoKGZ1bmN0aW9uIChyZWxhdGlvbnNoaXApIHtcblx0XHRcdHZhciByZWwgPSBkMy5zZWxlY3QodGhpcyksXG5cdFx0XHRcdG91dGxpbmUgPSByZWwuc2VsZWN0KFwiLm91dGxpbmVcIiksXG5cdFx0XHRcdHRleHQgPSByZWwuc2VsZWN0KFwiLnRleHRcIik7XG5cblx0XHRcdG91dGxpbmUuYXR0cihcImRcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0dmFyIGNlbnRlciA9IHsgeDogMCwgeTogMCB9LFxuXHRcdFx0XHRcdGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSxcblx0XHRcdFx0XHR0ZXh0Qm91bmRpbmdCb3ggPSB0ZXh0Lm5vZGUoKS5nZXRCQm94KCksXG5cdFx0XHRcdFx0dGV4dFBhZGRpbmcgPSA1LFxuXHRcdFx0XHRcdHUgPSB1bml0YXJ5VmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0dGV4dE1hcmdpbiA9IHtcblx0XHRcdFx0XHRcdHg6IChkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtICh0ZXh0Qm91bmRpbmdCb3gud2lkdGggKyB0ZXh0UGFkZGluZykgKiB1LngpICogMC41LFxuXHRcdFx0XHRcdFx0eTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55IC0gKHRleHRCb3VuZGluZ0JveC53aWR0aCArIHRleHRQYWRkaW5nKSAqIHUueSkgKiAwLjVcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdG4gPSB1bml0YXJ5Tm9ybWFsVmVjdG9yKGQuc291cmNlLCBkLnRhcmdldCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QTEgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtIG4ueCxcblx0XHRcdFx0XHRcdFx0eTogMCArIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0eyB4OiB0ZXh0TWFyZ2luLnggLSBuLngsIHk6IHRleHRNYXJnaW4ueSAtIG4ueSB9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IHRleHRNYXJnaW4ueCwgeTogdGV4dE1hcmdpbi55IH0sIGFuZ2xlKSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMSA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS54LFxuXHRcdFx0XHRcdFx0XHR5OiAwICsgKG9wdGlvbnMubm9kZVJhZGl1cyArIDEpICogdS55XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0YW5nbGVcblx0XHRcdFx0XHQpLFxuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyID0gcm90YXRlUG9pbnQoXG5cdFx0XHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHg6IGQudGFyZ2V0LnggLSBkLnNvdXJjZS54IC0gdGV4dE1hcmdpbi54IC0gbi54LFxuXHRcdFx0XHRcdFx0XHR5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIHRleHRNYXJnaW4ueSAtIG4ueVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnggLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnggLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCAtXG5cdFx0XHRcdFx0XHRcdFx0bi54IC1cblx0XHRcdFx0XHRcdFx0XHR1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSAtXG5cdFx0XHRcdFx0XHRcdFx0dS55ICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLVxuXHRcdFx0XHRcdFx0XHRcdG4ueCArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueCAtIHUueCkgKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC55IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS55IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLVxuXHRcdFx0XHRcdFx0XHRcdG4ueSArXG5cdFx0XHRcdFx0XHRcdFx0KG4ueSAtIHUueSkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1Lnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDpcblx0XHRcdFx0XHRcdFx0XHRkLnRhcmdldC54IC1cblx0XHRcdFx0XHRcdFx0XHRkLnNvdXJjZS54IC1cblx0XHRcdFx0XHRcdFx0XHQob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggK1xuXHRcdFx0XHRcdFx0XHRcdCgtbi54IC0gdS54KSAqIG9wdGlvbnMuYXJyb3dTaXplLFxuXHRcdFx0XHRcdFx0XHR5OlxuXHRcdFx0XHRcdFx0XHRcdGQudGFyZ2V0LnkgLVxuXHRcdFx0XHRcdFx0XHRcdGQuc291cmNlLnkgLVxuXHRcdFx0XHRcdFx0XHRcdChvcHRpb25zLm5vZGVSYWRpdXMgKyAxKSAqIHUueSArXG5cdFx0XHRcdFx0XHRcdFx0KC1uLnkgLSB1LnkpICogb3B0aW9ucy5hcnJvd1NpemVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCksXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIgPSByb3RhdGVQb2ludChcblx0XHRcdFx0XHRcdGNlbnRlcixcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnggLSB1LnggKiBvcHRpb25zLmFycm93U2l6ZSxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSAob3B0aW9ucy5ub2RlUmFkaXVzICsgMSkgKiB1LnkgLSB1LnkgKiBvcHRpb25zLmFycm93U2l6ZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGFuZ2xlXG5cdFx0XHRcdFx0KSxcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIHRleHRNYXJnaW4ueCxcblx0XHRcdFx0XHRcdFx0eTogZC50YXJnZXQueSAtIGQuc291cmNlLnkgLSB0ZXh0TWFyZ2luLnlcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhbmdsZVxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRcIk0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEExLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMS55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMS54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjEueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzEueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMxLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQxLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMS55ICtcblx0XHRcdFx0XHRcIiBaIE0gXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEEyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRBMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRCMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QjIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50QzIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEMyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEQyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnREMi55ICtcblx0XHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRFMi54ICtcblx0XHRcdFx0XHRcIiBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RTIueSArXG5cdFx0XHRcdFx0XCIgTCBcIiArXG5cdFx0XHRcdFx0cm90YXRlZFBvaW50RjIueCArXG5cdFx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEYyLnkgK1xuXHRcdFx0XHRcdFwiIEwgXCIgK1xuXHRcdFx0XHRcdHJvdGF0ZWRQb2ludEcyLnggK1xuXHRcdFx0XHRcdFwiIFwiICtcblx0XHRcdFx0XHRyb3RhdGVkUG9pbnRHMi55ICtcblx0XHRcdFx0XHRcIiBaXCJcblx0XHRcdFx0KTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gdGlja1JlbGF0aW9uc2hpcHNPdmVybGF5cygpIHtcblx0XHRyZWxhdGlvbnNoaXBPdmVybGF5LmF0dHIoXCJkXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRjb25zdCBjZW50ZXIgPSB7IHg6IDAsIHk6IDAgfTtcblx0XHRcdGNvbnN0IGFuZ2xlID0gcm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KTtcblx0XHRcdGNvbnN0IG4xID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpO1xuXHRcdFx0Y29uc3QgbiA9IHVuaXRhcnlOb3JtYWxWZWN0b3IoZC5zb3VyY2UsIGQudGFyZ2V0LCA1MCk7XG5cdFx0XHRjb25zdCByb3RhdGVkUG9pbnRBID0gcm90YXRlUG9pbnQoY2VudGVyLCB7IHg6IDAgLSBuLngsIHk6IDAgLSBuLnkgfSwgYW5nbGUpO1xuXHRcdFx0Y29uc3Qgcm90YXRlZFBvaW50QiA9IHJvdGF0ZVBvaW50KFxuXHRcdFx0XHRjZW50ZXIsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR4OiBkLnRhcmdldC54IC0gZC5zb3VyY2UueCAtIG4ueCxcblx0XHRcdFx0XHR5OiBkLnRhcmdldC55IC0gZC5zb3VyY2UueSAtIG4ueVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhbmdsZVxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHJvdGF0ZWRQb2ludEMgPSByb3RhdGVQb2ludChcblx0XHRcdFx0Y2VudGVyLFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0eDogZC50YXJnZXQueCAtIGQuc291cmNlLnggKyBuLnggLSBuMS54LFxuXHRcdFx0XHRcdHk6IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55ICsgbi55IC0gbjEueVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRhbmdsZVxuXHRcdFx0KTtcblx0XHRcdGNvbnN0IHJvdGF0ZWRQb2ludEQgPSByb3RhdGVQb2ludChjZW50ZXIsIHsgeDogMCArIG4ueCAtIG4xLngsIHk6IDAgKyBuLnkgLSBuMS55IH0sIGFuZ2xlKTtcblxuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XCJNIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50QS54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRBLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qi54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRCLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50Qy54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRDLnkgK1xuXHRcdFx0XHRcIiBMIFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50RC54ICtcblx0XHRcdFx0XCIgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnRELnkgK1xuXHRcdFx0XHRcIiBaXCJcblx0XHRcdCk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB0aWNrUmVsYXRpb25zaGlwc1RleHRzKCkge1xuXHRcdHJlbGF0aW9uc2hpcFRleHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0Y29uc3QgYW5nbGUgPSAocm90YXRpb24oZC5zb3VyY2UsIGQudGFyZ2V0KSArIDM2MCkgJSAzNjA7XG5cdFx0XHRjb25zdCBtaXJyb3IgPSBhbmdsZSA+IDkwICYmIGFuZ2xlIDwgMjcwO1xuXHRcdFx0Y29uc3QgY2VudGVyID0geyB4OiAwLCB5OiAwIH07XG5cdFx0XHRjb25zdCBuID0gdW5pdGFyeU5vcm1hbFZlY3RvcihkLnNvdXJjZSwgZC50YXJnZXQpO1xuXHRcdFx0Y29uc3QgbldlaWdodCA9IG1pcnJvciA/IDIgOiAtMztcblx0XHRcdGNvbnN0IHBvaW50ID0ge1xuXHRcdFx0XHR4OiAoZC50YXJnZXQueCAtIGQuc291cmNlLngpICogMC41ICsgbi54ICogbldlaWdodCxcblx0XHRcdFx0eTogKGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55KSAqIDAuNSArIG4ueSAqIG5XZWlnaHRcblx0XHRcdH07XG5cdFx0XHRjb25zdCByb3RhdGVkUG9pbnQgPSByb3RhdGVQb2ludChjZW50ZXIsIHBvaW50LCBhbmdsZSk7XG5cblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFwidHJhbnNsYXRlKFwiICtcblx0XHRcdFx0cm90YXRlZFBvaW50LnggK1xuXHRcdFx0XHRcIiwgXCIgK1xuXHRcdFx0XHRyb3RhdGVkUG9pbnQueSArXG5cdFx0XHRcdFwiKSByb3RhdGUoXCIgK1xuXHRcdFx0XHQobWlycm9yID8gMTgwIDogMCkgK1xuXHRcdFx0XHRcIilcIlxuXHRcdFx0KTtcblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHRvU3RyaW5nKGQpIHtcblx0XHRsZXQgcyA9IGQubGFiZWxzID8gZC5sYWJlbHNbMF0gOiBkLnR5cGU7XG5cdFx0cyArPSBcIiAoPGlkPjogXCIgKyBkLmlkO1xuXG5cdFx0T2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0cyArPSBcIiwgXCIgKyBwcm9wZXJ0eSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGQucHJvcGVydGllc1twcm9wZXJ0eV0pO1xuXHRcdH0pO1xuXG5cdFx0cyArPSBcIilcIjtcblx0XHRyZXR1cm4gcztcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlOb3JtYWxWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdGNvbnN0IGNlbnRlciA9IHsgeDogMCwgeTogMCB9O1xuXHRcdGNvbnN0IHZlY3RvciA9IHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCk7XG5cblx0XHRyZXR1cm4gcm90YXRlUG9pbnQoY2VudGVyLCB2ZWN0b3IsIDkwKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVuaXRhcnlWZWN0b3Ioc291cmNlLCB0YXJnZXQsIG5ld0xlbmd0aCkge1xuXHRcdGNvbnN0IGxlbmd0aCA9XG5cdFx0XHRNYXRoLnNxcnQoTWF0aC5wb3codGFyZ2V0LnggLSBzb3VyY2UueCwgMikgKyBNYXRoLnBvdyh0YXJnZXQueSAtIHNvdXJjZS55LCAyKSkgL1xuXHRcdFx0TWF0aC5zcXJ0KG5ld0xlbmd0aCB8fCAxKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHR4OiAodGFyZ2V0LnggLSBzb3VyY2UueCkgLyBsZW5ndGgsXG5cdFx0XHR5OiAodGFyZ2V0LnkgLSBzb3VyY2UueSkgLyBsZW5ndGhcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpIHtcblx0XHR1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMoZDNEYXRhLm5vZGVzLCBkM0RhdGEucmVsYXRpb25zaGlwcyk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVXaXRoTmVvNGpEYXRhKG5lbzRqRGF0YSkge1xuXHRcdGNvbnN0IGQzRGF0YSA9IG5lbzRqRGF0YVRvRDNEYXRhKG5lbzRqRGF0YSk7XG5cdFx0dXBkYXRlV2l0aEQzRGF0YShkM0RhdGEpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlSW5mbyhkKSB7XG5cdFx0Y2xlYXJJbmZvKCk7XG5cblx0XHRpZiAoZC5sYWJlbHMpIHtcblx0XHRcdGFwcGVuZEluZm9FbGVtZW50Q2xhc3MoXCJjbGFzc1wiLCBkLmxhYmVsc1swXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFwcGVuZEluZm9FbGVtZW50UmVsYXRpb25zaGlwKFwiY2xhc3NcIiwgZC50eXBlKTtcblx0XHR9XG5cblx0XHRhcHBlbmRJbmZvRWxlbWVudFByb3BlcnR5KFwicHJvcGVydHlcIiwgXCImbHQ7aWQmZ3Q7XCIsIGQuaWQpO1xuXG5cdFx0T2JqZWN0LmtleXMoZC5wcm9wZXJ0aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdFx0YXBwZW5kSW5mb0VsZW1lbnRQcm9wZXJ0eShcInByb3BlcnR5XCIsIHByb3BlcnR5LCBKU09OLnN0cmluZ2lmeShkLnByb3BlcnRpZXNbcHJvcGVydHldKSk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2RlcyhuKSB7XG5cdFx0QXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkobm9kZXMsIG4pO1xuXHRcdG5vZGUgPSBzdmdOb2Rlcy5zZWxlY3RBbGwoXCIubm9kZVwiKS5kYXRhKG5vZGVzLCAoZCkgPT4gZC5pZCk7XG5cblx0XHRjb25zdCBub2RlRW50ZXIgPSBhcHBlbmROb2RlVG9HcmFwaCgpO1xuXHRcdG5vZGUgPSBub2RlRW50ZXIubWVyZ2Uobm9kZSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVOb2Rlc0FuZFJlbGF0aW9uc2hpcHMobiwgcikge1xuXHRcdHVwZGF0ZVJlbGF0aW9uc2hpcHMocik7XG5cdFx0dXBkYXRlTm9kZXMobik7XG5cblx0XHRzaW11bGF0aW9uLm5vZGVzKG5vZGVzKTtcblx0XHRzaW11bGF0aW9uLmZvcmNlKFwibGlua1wiKS5saW5rcyhyZWxhdGlvbnNoaXBzKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHVwZGF0ZVJlbGF0aW9uc2hpcHMocikge1xuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHJlbGF0aW9uc2hpcHMsIHIpO1xuXHRcdHJlbGF0aW9uc2hpcCA9IHN2Z1JlbGF0aW9uc2hpcHMuc2VsZWN0QWxsKFwiLnJlbGF0aW9uc2hpcFwiKS5kYXRhKHJlbGF0aW9uc2hpcHMsIChkKSA9PiBkLmlkKTtcblxuXHRcdGNvbnN0IHJlbGF0aW9uc2hpcEVudGVyID0gYXBwZW5kUmVsYXRpb25zaGlwVG9HcmFwaCgpO1xuXHRcdHJlbGF0aW9uc2hpcCA9IHJlbGF0aW9uc2hpcEVudGVyLnJlbGF0aW9uc2hpcC5tZXJnZShyZWxhdGlvbnNoaXApO1xuXG5cdFx0cmVsYXRpb25zaGlwT3V0bGluZSA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC5vdXRsaW5lXCIpO1xuXHRcdHJlbGF0aW9uc2hpcE91dGxpbmUgPSByZWxhdGlvbnNoaXBFbnRlci5vdXRsaW5lLm1lcmdlKHJlbGF0aW9uc2hpcE91dGxpbmUpO1xuXG5cdFx0cmVsYXRpb25zaGlwT3ZlcmxheSA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC5vdmVybGF5XCIpO1xuXHRcdHJlbGF0aW9uc2hpcE92ZXJsYXkgPSByZWxhdGlvbnNoaXBFbnRlci5vdmVybGF5Lm1lcmdlKHJlbGF0aW9uc2hpcE92ZXJsYXkpO1xuXG5cdFx0cmVsYXRpb25zaGlwVGV4dCA9IHN2Zy5zZWxlY3RBbGwoXCIucmVsYXRpb25zaGlwIC50ZXh0XCIpO1xuXHRcdHJlbGF0aW9uc2hpcFRleHQgPSByZWxhdGlvbnNoaXBFbnRlci50ZXh0Lm1lcmdlKHJlbGF0aW9uc2hpcFRleHQpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdmVyc2lvbigpIHtcblx0XHRyZXR1cm4gVkVSU0lPTjtcblx0fVxuXG5cdGZ1bmN0aW9uIHpvb21GaXQodHJhbnNpdGlvbkR1cmF0aW9uKSB7XG5cdFx0dmFyIGJvdW5kcyA9IHN2Zy5ub2RlKCkuZ2V0QkJveCgpLFxuXHRcdFx0cGFyZW50ID0gc3ZnLm5vZGUoKS5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQsXG5cdFx0XHRmdWxsV2lkdGggPSBwYXJlbnQuY2xpZW50V2lkdGgsXG5cdFx0XHRmdWxsSGVpZ2h0ID0gcGFyZW50LmNsaWVudEhlaWdodCxcblx0XHRcdHdpZHRoID0gYm91bmRzLndpZHRoLFxuXHRcdFx0aGVpZ2h0ID0gYm91bmRzLmhlaWdodCxcblx0XHRcdG1pZFggPSBib3VuZHMueCArIHdpZHRoIC8gMixcblx0XHRcdG1pZFkgPSBib3VuZHMueSArIGhlaWdodCAvIDI7XG5cblx0XHRpZiAod2lkdGggPT09IDAgfHwgaGVpZ2h0ID09PSAwKSB7XG5cdFx0XHQvLyBub3RoaW5nIHRvIGZpdFxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN2Z1NjYWxlID0gMC44NSAvIE1hdGgubWF4KHdpZHRoIC8gZnVsbFdpZHRoLCBoZWlnaHQgLyBmdWxsSGVpZ2h0KTtcblx0XHRzdmdUcmFuc2xhdGUgPSBbZnVsbFdpZHRoIC8gMiAtIHN2Z1NjYWxlICogbWlkWCwgZnVsbEhlaWdodCAvIDIgLSBzdmdTY2FsZSAqIG1pZFldO1xuXG5cdFx0c3ZnLmF0dHIoXG5cdFx0XHRcInRyYW5zZm9ybVwiLFxuXHRcdFx0XCJ0cmFuc2xhdGUoXCIgKyBzdmdUcmFuc2xhdGVbMF0gKyBcIiwgXCIgKyBzdmdUcmFuc2xhdGVbMV0gKyBcIikgc2NhbGUoXCIgKyBzdmdTY2FsZSArIFwiKVwiXG5cdFx0KTtcblx0fVxuXG5cdGluaXQoX3NlbGVjdG9yLCBfb3B0aW9ucyk7XG5cblx0cmV0dXJuIHtcblx0XHRhcHBlbmRSYW5kb21EYXRhVG9Ob2RlOiBhcHBlbmRSYW5kb21EYXRhVG9Ob2RlLFxuXHRcdG5lbzRqRGF0YVRvRDNEYXRhOiBuZW80akRhdGFUb0QzRGF0YSxcblx0XHRyYW5kb21EM0RhdGE6IHJhbmRvbUQzRGF0YSxcblx0XHRyZXNldFdpdGhOZW80akRhdGE6IHJlc2V0V2l0aE5lbzRqRGF0YSxcblx0XHRzaXplOiBzaXplLFxuXHRcdHVwZGF0ZVdpdGhEM0RhdGE6IHVwZGF0ZVdpdGhEM0RhdGEsXG5cdFx0dXBkYXRlV2l0aE5lbzRqRGF0YTogdXBkYXRlV2l0aE5lbzRqRGF0YSxcblx0XHR2ZXJzaW9uOiB2ZXJzaW9uXG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTmVvNGpEMztcbiJdfQ==
