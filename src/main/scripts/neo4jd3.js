"use strict";

import * as d3 from "d3";
import fontAwesomeIcons from "./fontAwesomeIcons";

class Neo4jD3 {
	constructor(_selector, _options) {
		this.container;
		this.info;
		this.node;
		this.nodes;
		this.relationship;
		this.relationshipOutline;
		this.relationshipOverlay;
		this.relationshipText;
		this.relationships;
		this.selector;
		this.simulation;
		this.svg;
		this.svgNodes;
		this.svgRelationships;
		this.svgScale;
		this.svgTranslate;
		this.classes2colors = {};
		this.justLoaded = false;
		this.numClasses = 0;
		this.options = {
			arrowSize: 4,
			colors: this.colors(),
			highlight: undefined,
			iconMap: fontAwesomeIcons,
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
			zoomFit: false,
			showNullProperties: false,
		};

		this.init(_selector, _options);
	}

	init(_selector, _options) {
		this.initIconMap();

		this.merge(this.options, _options);

		if (this.options.icons) {
			this.options.showIcons = true;
		}

		if (!this.options.minCollision) {
			this.options.minCollision = this.options.nodeRadius * 2;
		}

		this.initImageMap();

		this.selector = _selector;
		this.container = d3.select(_selector);
		this.container.attr("class", "neo4jd3").html("");

		if (this.options.infoPanel) {
			this.info = this.appendInfoPanel(this.container);
		}

		this.appendGraph(this.container);
		this.simulation = this.initSimulation();

		if (this.options.neo4jData) {
			this.loadNeo4jData(this.options.neo4jData);
		} else if (this.options.neo4jDataUrl) {
			this.loadNeo4jDataFromUrl(this.options.neo4jDataUrl);
		} else {
			console.error("Error: both neo4jData and neo4jDataUrl are empty!");
		}
	}

	/**
	 * Appends the generated graph to the element tied to the specified
	 * selector in the DOM.
	 * @param {HTMLElement} container The container element to append the graph to.
	 */
	appendGraph(container) {
		this.svg = container
			.append("svg")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("class", "neo4jd3-graph")
			.call(
				d3.zoom().on("zoom", (event) => {
					let scale = event.transform.k;
					const translate = [event.transform.x, event.transform.y];

					if (this.svgTranslate) {
						translate[0] += this.svgTranslate[0];
						translate[1] += this.svgTranslate[1];
					}

					if (this.svgScale) {
						scale *= this.svgScale;
					}

					this.svg.attr("transform", `translate(${translate[0]}, ${translate[1]}) scale(${scale})`);
				})
			)
			.on("dblclick.zoom", null)
			.append("g")
			.attr("width", "100%")
			.attr("height", "100%");

		this.svgRelationships = this.svg.append("g").attr("class", "relationships");
		this.svgNodes = this.svg.append("g").attr("class", "nodes");
	}

	appendImageToNode(node) {
		return node
			.append("image")
			.attr("height", (d) => {
				return this.icon(d) ? "24px" : "30px";
			})
			.attr("x", (d) => {
				return this.icon(d) ? "5px" : "-15px";
			})
			.attr("xlink:href", (d) => {
				return this.image(d);
			})
			.attr("y", (d) => {
				return this.icon(d) ? "5px" : "-16px";
			})
			.attr("width", (d) => {
				return this.icon(d) ? "24px" : "30px";
			});
	}

	appendInfoPanel(container) {
		return container.append("div").attr("class", "neo4jd3-info");
	}

	appendInfoElement(cls, isNode, property, value) {
		const elem = this.info.append("a");

		elem
			.attr("href", "#")
			.attr("class", cls)
			// skipcq: JS-0246
			.html(`<strong>${property}</strong>` + (value ? ": " + value : ""));

		if (!value) {
			elem
				.style("background-color", (_d) => {
					return this.options.nodeOutlineFillColor
						? this.options.nodeOutlineFillColor
						: isNode
						? this.class2color(property)
						: this.defaultColor();
				})
				.style("border-color", (_d) => {
					return this.options.nodeOutlineFillColor
						? this.class2darkenColor(this.options.nodeOutlineFillColor)
						: isNode
						? this.class2darkenColor(property)
						: this.defaultDarkenColor();
				})
				.style("color", (_d) => {
					return this.options.nodeOutlineFillColor
						? this.class2darkenColor(this.options.nodeOutlineFillColor)
						: "#fff";
				});
		}
	}

	appendInfoElementClass(cls, node) {
		this.appendInfoElement(cls, true, node);
	}

	appendInfoElementProperty(cls, property, value) {
		this.appendInfoElement(cls, false, property, value);
	}

	appendInfoElementRelationship(cls, relationship) {
		this.appendInfoElement(cls, false, relationship);
	}

	appendNode() {
		return this.node
			.enter()
			.append("g")
			.attr("class", (d) => {
				let classes = "node";

				if (this.icon(d)) {
					classes += " node-icon";
				}

				if (this.image(d)) {
					classes += " node-image";
				}

				if (this.options.highlight) {
					for (let i = 0; i < this.options.highlight.length; i++) {
						const highlight = this.options.highlight[i];

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
			.on("click", (event, d) => {
				d.fx = d.fy = null;

				if (typeof this.options.onNodeClick === "function") {
					this.options.onNodeClick(d);
				}
			})
			.on("dblclick", (event, d) => {
				if (typeof this.options.onNodeDoubleClick === "function") {
					this.options.onNodeDoubleClick(d);
				} else {
					this.stickNode(event, d);
				}
			})
			.on("mouseenter", (event, d) => {
				if (this.info) {
					this.updateInfo(d);
				}

				if (typeof this.options.onNodeMouseEnter === "function") {
					this.options.onNodeMouseEnter(d);
				}
			})
			.on("mouseleave", (event, d) => {
				if (this.info) {
					this.clearInfo(d);
				}

				if (typeof this.options.onNodeMouseLeave === "function") {
					this.options.onNodeMouseLeave(d);
				}
			})
			.call(
				d3
					.drag()
					.on("start", this.dragStarted.bind(this))
					.on("drag", this.dragged.bind(this))
					.on("end", this.dragEnded.bind(this))
			);
	}

	appendNodeToGraph() {
		const n = this.appendNode();

		this.appendRingToNode(n);
		this.appendOutlineToNode(n);

		if (this.options.icons) {
			this.appendTextToNode(n);
		}

		if (this.options.images) {
			this.appendImageToNode(n);
		}

		return n;
	}

	/**
	 * Appends an outline (border) to the specified node.
	 * @param {Object} node The node to append the outline to.
	 * @returns {Object} The node with the appended outline.
	 */
	appendOutlineToNode(node) {
		return node
			.append("circle")
			.attr("class", "outline")
			.attr("r", this.options.nodeRadius)
			.style("fill", (d) => {
				return this.options.nodeOutlineFillColor
					? this.options.nodeOutlineFillColor
					: this.class2color(d.labels[0]);
			})
			.style("stroke", (d) => {
				return this.options.nodeOutlineFillColor
					? this.class2darkenColor(this.options.nodeOutlineFillColor)
					: this.class2darkenColor(d.labels[0]);
			})
			.append("title")
			.text((d) => {
				return this.toString(d);
			});
	}

	/**
	 * Appends a ring to the node that will be displayed when the node is hovered over.
	 * @param {Object} node The node to append the ring to.
	 * @returns {Object} The node with the ring appended.
	 */
	appendRingToNode(node) {
		return node
			.append("circle")
			.attr("class", "ring")
			.attr("r", this.options.nodeRadius * 1.16)
			.append("title")
			.text((d) => {
				return this.toString(d);
			});
	}

	appendTextToNode(node) {
		return node
			.append("text")
			.attr("class", (d) => {
				return "text" + (this.icon(d) ? " icon" : "");
			})
			.attr("fill", this.options.nodeTextColor)
			.attr("font-size", (d) => {
				return this.icon(d) ? this.options.nodeRadius + "px" : "10px";
			})
			.attr("pointer-events", "none")
			.attr("text-anchor", "middle")
			.attr("y", (d) => {
				return this.icon(d)
					? parseInt(Math.round(this.options.nodeRadius * 0.32), 10) + "px"
					: "4px";
			})
			.html((d) => {
				const _icon = this.icon(d);
				let text = d.id;
				if (this.options.nodeTextProperty) {
					text = d.properties[this.options.nodeTextProperty];
				}

				return _icon ? "&#x" + _icon : text;
			});
	}

	appendRandomDataToNode(d, maxNodesToGenerate) {
		const data = this.randomD3Data(d, maxNodesToGenerate);
		this.updateWithNeo4jData(data);
	}

	appendRelationship() {
		return this.relationship
			.enter()
			.append("g")
			.attr("class", "relationship")
			.on("dblclick", (d) => {
				if (typeof this.options.onRelationshipDoubleClick === "function") {
					this.options.onRelationshipDoubleClick(d);
				}
			})
			.on("mouseenter", (event, d) => {
				if (this.info) {
					this.updateInfo(d);
				}
			});
	}

	/**
	 * Appends an outline path to the specified relationship.
	 * @param {Object} r The relationship object
	 * @returns {Object} The relationship with an outline apppended
	 */
	appendOutlineToRelationship(r) {
		return r.append("path").attr("class", "outline").attr("fill", "#a5abb6").attr("stroke", "none");
	}

	/**
	 * Appends an overlay path to the specified relationship.
	 * @param {Object} r The relationship object
	 * @returns {Object} The relationship with the overlay appended
	 */
	appendOverlayToRelationship(r) {
		return r.append("path").attr("class", "overlay");
	}

	appendTextToRelationship(r) {
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

	appendRelationshipToGraph() {
		const relationship = this.appendRelationship();
		const text = this.appendTextToRelationship(relationship);
		const outline = this.appendOutlineToRelationship(relationship);
		const overlay = this.appendOverlayToRelationship(relationship);

		return {
			outline,
			overlay,
			relationship,
			text
		};
	}

	class2color(cls) {
		let color = this.classes2colors[cls];

		if (!color) {
			color = this.options.colors[this.numClasses % this.options.colors.length];
			this.classes2colors[cls] = color;
			this.numClasses++;
		}

		return color;
	}

	class2darkenColor(cls) {
		return d3.rgb(this.class2color(cls)).darker(1);
	}

	clearInfo() {
		this.info.html("");
	}

	/**
	 * Returns the default colors used within the library.
	 * @returns {Array} The default library colors
	 */
	colors() {
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

	contains(array, id) {
		const filter = array.filter((elem) => elem.id === id);
		return filter.length > 0;
	}

	defaultColor() {
		return this.options.relationshipColor;
	}

	defaultDarkenColor() {
		return d3.rgb(this.options.colors[this.options.colors.length - 1]).darker(1);
	}

	dragEnded(event, d) {
		if (!event.active) {
			this.simulation.alphaTarget(0);
		}

		if (typeof this.options.onNodeDragEnd === "function") {
			this.options.onNodeDragEnd(d);
		}
	}

	dragged(event, d) {
		this.stickNode(event, d);
	}

	dragStarted(event, d) {
		if (!event.active) {
			this.simulation.alphaTarget(0.3).restart();
		}

		d.fx = d.x;
		d.fy = d.y;

		if (typeof this.options.onNodeDragStart === "function") {
			this.options.onNodeDragStart(d);
		}
	}

	icon(d) {
		let code;

		if (this.options.iconMap && this.options.showIcons && this.options.icons) {
			if (
				this.options.icons[d.labels[0]] &&
				this.options.iconMap[this.options.icons[d.labels[0]]]
			) {
				code = this.options.iconMap[this.options.icons[d.labels[0]]];
			} else if (this.options.iconMap[d.labels[0]]) {
				code = this.options.iconMap[d.labels[0]];
			} else if (this.options.icons[d.labels[0]]) {
				code = this.options.icons[d.labels[0]];
			}
		}

		return code;
	}

	image(d) {
		let imagesForLabel, img, imgLevel, label, labelPropertyValue, property, value;

		if (this.options.images) {
			imagesForLabel = this.options.imageMap[d.labels[0]];

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
							img = this.options.images[imagesForLabel[i]];
							imgLevel = labelPropertyValue.length;
						}
					}
				}
			}
		}

		return img;
	}

	initIconMap() {
		Object.keys(this.options.iconMap).forEach((key) => {
			const keys = key.split(",");
			const value = this.options.iconMap[key];

			keys.forEach((key) => {
				this.options.iconMap[key] = value;
			});
		});
	}

	initImageMap() {
		let keys;

		for (const key in this.options.images) {
			if (Object.prototype.hasOwnProperty.call(this.options.images, key)) {
				keys = key.split("|");

				if (!this.options.imageMap[keys[0]]) {
					this.options.imageMap[keys[0]] = [key];
				} else {
					this.options.imageMap[keys[0]].push(key);
				}
			}
		}
	}

	initSimulation() {
		const simulation = d3
			.forceSimulation()
			.force(
				"collide",
				d3
					.forceCollide()
					.radius((_d) => {
						return this.options.minCollision;
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
					this.svg.node().parentElement.parentElement.clientWidth / 2,
					this.svg.node().parentElement.parentElement.clientHeight / 2
				)
			)
			.on("tick", () => {
				this.tick();
			})
			.on("end", () => {
				if (this.options.zoomFit && !this.justLoaded) {
					this.justLoaded = true;
					this.zoomFit(2);
				}
			});

		return simulation;
	}

	loadNeo4jData() {
		this.nodes = [];
		this.relationships = [];

		this.updateWithNeo4jData(this.options.neo4jData);
	}

	loadNeo4jDataFromUrl(neo4jDataUrl) {
		this.nodes = [];
		this.relationships = [];

		d3.json(neo4jDataUrl)
			.then((data) => {
				this.updateWithNeo4jData(data);
			})
			.catch((error) => {
				throw error;
			});
	}

	/**
	 * Helper function to merge the properties of two objects.
	 * @param {Object} target The target object.
	 * @param {Object} source The source object.
	 */
	merge(target, source) {
		Object.keys(source).forEach(function (property) {
			target[property] = source[property];
		});
	}

	/**
	 * Converts data from the neo4j format to the d3 format.
	 * @param {Object} data The neo4j data.
	 * @returns The d3 data.
	 */
	neo4jDataToD3Data(data) {
		const graph = {
			nodes: [],
			relationships: []
		};

		// Detects if the data is in the format of the REST API or the Bolt driver
		// and converts it to the d3 format
		if (data?.results) {
			return this.convertRESTDataToD3Data(graph, data);
		} else {
			return this.convertDriverDataToD3Data(graph, data);
		}
	}

	/**
	 * Converts data from the neo4j REST API format to the d3 format.
	 * @link https://neo4j.com/developer/javascript/#js-http-endpoint
	 * @param {{nodes: Array, relationships: Array}} graph
	 * @param {Object} data
	 */
	convertRESTDataToD3Data(graph, data) {
		data.results.forEach((result) => {
			result.data.forEach((data) => {
				data.graph.nodes.forEach((node) => {
					if (!this.contains(graph.nodes, node.id)) {
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

		console.debug("convertRESTDataToD3Data graph: ", graph);
		return graph;
	}

	/**
	 * Converts data from the neo4j JavaScript driver format to the d3 format.
	 * @link https://neo4j.com/developer/javascript/#js-driver
	 * @param {{nodes: Array, relationships: Array}} graph
	 * @param {Object} data
	 * @todo Define `data` type based on https://neo4j.com/developer/javascript/#js-http-endpoint
	 */
	convertDriverDataToD3Data(graph, data) {
		const foundNodes = [];
		const foundRelationships = [];

		if (data.records) {
			// Handle data that hasn't been mapped to `record.toObject()`
			data.records.forEach(function (record) {
				record._fields.forEach(function (field) {
					if (field.identity) {
						foundNodes.push(field);
					} else if (field.start) {
						foundRelationships.push(field);
					}
				});
			});
		} else {
			// Handle data that has already been mapped to `record.toObject()`
			data.forEach(function (record) {
				for (const key in record) {
					const field = record[key];
					if (!field) continue;
					if (field.start) {
						foundRelationships.push(field);
					} else {
						// IDEA: Go the `if (!contains(graph.nodes, node.id))` route
						foundNodes.push(field);
					}
				}
			});
		}

		const uniqueNodes = foundNodes.filter(
			(e, i) => foundNodes.findIndex((a) => a.elementId === e.elementId) === i
		);
		graph.nodes.push(...uniqueNodes);

		const uniqueRelationships = foundRelationships.filter(
			(e, i) =>
				foundRelationships.findIndex(
					(a) =>
						a.startNodeElementId === e.startNodeElementId &&
						a.endNodeElementId === e.endNodeElementId &&
						a.type === e.type
				) === i
		);
		for (const relationship of uniqueRelationships) {
			const startNode = uniqueNodes.find(
				(node) => node.elementId === relationship.startNodeElementId
			);
			const endNode = uniqueNodes.find((node) => node.elementId === relationship.endNodeElementId);
			relationship.source = startNode;
			relationship.target = endNode;
		}
		graph.relationships.push(...uniqueRelationships);

		graph.relationships.sort(function (a, b) {
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

		for (let i = 0; i < graph.relationships.length; i++) {
			if (
				i !== 0 &&
				graph.relationships[i].source === graph.relationships[i - 1].source &&
				graph.relationships[i].target === graph.relationships[i - 1].target
			) {
				graph.relationships[i].linknum = graph.relationships[i - 1].linknum + 1;
			} else {
				graph.relationships[i].linknum = 1;
			}
		}

		console.debug("convertDriverDataToD3Data graph: ", graph);
		return graph;
	}

	randomD3Data(d, maxNodesToGenerate) {
		const data = {
			nodes: [],
			relationships: []
		};
		const numNodes = ((maxNodesToGenerate * Math.random()) << 0) + 1;
		const s = this.size();

		let relationship;
		let label;
		let node;

		for (let i = 0; i < numNodes; i++) {
			label = this.randomLabel();

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

	randomLabel() {
		const icons = Object.keys(this.options.iconMap);
		return icons[(icons.length * Math.random()) << 0];
	}

	resetWithNeo4jData(neo4jData) {
		// Call the init method again with new data
		const newOptions = Object.assign(this.options, {
			neo4jData: neo4jData,
			neo4jDataUrl: undefined
		});
		this.init(this.selector, newOptions);
	}

	rotate(cx, cy, x, y, angle) {
		const radians = (Math.PI / 180) * angle;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		const nx = cos * (x - cx) + sin * (y - cy) + cx;
		const ny = cos * (y - cy) - sin * (x - cx) + cy;

		return { x: nx, y: ny };
	}

	/**
	 * Calls the `rotate` function on a specified point.
	 * @param {Object} center The coordinates of the center of the rotation.
	 * @param {Object} point The coordinates of the point to rotate.
	 * @param {number} angle The angle to rotate the point by.
	 * @returns {Object} The rotated point.
	 */
	rotatePoint(center, point, angle) {
		return this.rotate(center.x, center.y, point.x, point.y, angle);
	}

	/**
	 * Calculates the rotation of a link between two nodes.
	 * @param {Object} source The source node of the relationship.
	 * @param {Object} target The target node of the relationship.
	 * @returns {number} The angle of the link.
	 */
	rotation(source, target) {
		return (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI;
	}

	/**
	 * Calculates the size of the graphm i.e. the number of nodes and relationships.
	 * @returns {{nodes: number, relationships: number}} The size of the graph.
	 */
	size() {
		return {
			nodes: this.nodes.length,
			relationships: this.relationships.length
		};
	}

	/**
	 * Removes any velocity from the specified node.
	 */
	stickNode(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	tick() {
		this.tickNodes();
		this.tickRelationships();
	}

	tickNodes() {
		if (this.node) {
			this.node.attr("transform", function (d) {
				return `translate(${d.x}, ${d.y})`;
			});
		}
	}

	tickRelationships() {
		if (this.relationship) {
			this.relationship.attr("transform", (d) => {
				const angle = this.rotation(d.source, d.target);
				return `translate(${d.source.x}, ${d.source.y}) rotate(${angle})`;
			});

			this.tickRelationshipsTexts();
			this.tickRelationshipsOutlines();
			this.tickRelationshipsOverlays();
		}
	}

	tickRelationshipsOutlines() {
		const rotation = this.rotation.bind(this);
		const unitaryVector = this.unitaryVector.bind(this);
		const unitaryNormalVector = this.unitaryNormalVector.bind(this);
		const rotatePoint = this.rotatePoint.bind(this);
		const options = this.options;
		this.relationship.each(function (_relationship) {
			const rel = d3.select(this);
			const outline = rel.select(".outline");
			const text = rel.select(".text");

			outline.attr("d", (d) => {
				const center = { x: 0, y: 0 };
				const angle = rotation(d.source, d.target);
				const textBoundingBox = text.node().getBBox();
				const textPadding = 5;
				const u = unitaryVector(d.source, d.target);
				const textMargin = {
					x: (d.target.x - d.source.x - (textBoundingBox.width + textPadding) * u.x) * 0.5,
					y: (d.target.y - d.source.y - (textBoundingBox.width + textPadding) * u.y) * 0.5
				};
				const n = unitaryNormalVector(d.source, d.target);
				const rotatedPointA1 = rotatePoint(
					center,
					{
						x: 0 + (options.nodeRadius + 1) * u.x - n.x,
						y: 0 + (options.nodeRadius + 1) * u.y - n.y
					},
					angle
				);
				const rotatedPointB1 = rotatePoint(
					center,
					{ x: textMargin.x - n.x, y: textMargin.y - n.y },
					angle
				);
				const rotatedPointC1 = rotatePoint(center, { x: textMargin.x, y: textMargin.y }, angle);
				const rotatedPointD1 = rotatePoint(
					center,
					{
						x: 0 + (options.nodeRadius + 1) * u.x,
						y: 0 + (options.nodeRadius + 1) * u.y
					},
					angle
				);
				const rotatedPointA2 = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x - textMargin.x - n.x,
						y: d.target.y - d.source.y - textMargin.y - n.y
					},
					angle
				);
				const rotatedPointB2 = rotatePoint(
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
				);
				const rotatedPointC2 = rotatePoint(
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
				);
				const rotatedPointD2 = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x,
						y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y
					},
					angle
				);
				const rotatedPointE2 = rotatePoint(
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
				);
				const rotatedPointF2 = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x - (options.nodeRadius + 1) * u.x - u.x * options.arrowSize,
						y: d.target.y - d.source.y - (options.nodeRadius + 1) * u.y - u.y * options.arrowSize
					},
					angle
				);
				const rotatedPointG2 = rotatePoint(
					center,
					{
						x: d.target.x - d.source.x - textMargin.x,
						y: d.target.y - d.source.y - textMargin.y
					},
					angle
				);

				return (
					`M ${rotatedPointA1.x} ${rotatedPointA1.y} ` +
					`L ${rotatedPointB1.x} ${rotatedPointB1.y} ` +
					`L ${rotatedPointC1.x} ${rotatedPointC1.y} ` +
					`L ${rotatedPointD1.x} ${rotatedPointD1.y} ` +
					`Z M ${rotatedPointA2.x} ${rotatedPointA2.y} ` +
					`L ${rotatedPointB2.x} ${rotatedPointB2.y} ` +
					`L ${rotatedPointC2.x} ${rotatedPointC2.y} ` +
					`L ${rotatedPointD2.x} ${rotatedPointD2.y} ` +
					`L ${rotatedPointE2.x} ${rotatedPointE2.y} ` +
					`L ${rotatedPointF2.x} ${rotatedPointF2.y} ` +
					`L ${rotatedPointG2.x} ${rotatedPointG2.y} Z`
				);
			});
		});
	}

	tickRelationshipsOverlays() {
		this.relationshipOverlay.attr("d", (d) => {
			const center = { x: 0, y: 0 };
			const angle = this.rotation(d.source, d.target);
			const n1 = this.unitaryNormalVector(d.source, d.target);
			const n = this.unitaryNormalVector(d.source, d.target, 50);
			const rotatedPointA = this.rotatePoint(center, { x: 0 - n.x, y: 0 - n.y }, angle);
			const rotatedPointB = this.rotatePoint(
				center,
				{
					x: d.target.x - d.source.x - n.x,
					y: d.target.y - d.source.y - n.y
				},
				angle
			);
			const rotatedPointC = this.rotatePoint(
				center,
				{
					x: d.target.x - d.source.x + n.x - n1.x,
					y: d.target.y - d.source.y + n.y - n1.y
				},
				angle
			);
			const rotatedPointD = this.rotatePoint(
				center,
				{ x: 0 + n.x - n1.x, y: 0 + n.y - n1.y },
				angle
			);

			return (
				`M ${rotatedPointA.x} ${rotatedPointA.y}` +
				` L ${rotatedPointB.x} ${rotatedPointB.y}` +
				` L ${rotatedPointC.x} ${rotatedPointC.y}` +
				` L ${rotatedPointD.x} ${rotatedPointD.y} Z`
			);
		});
	}

	tickRelationshipsTexts() {
		this.relationshipText.attr("transform", (d) => {
			const angle = (this.rotation(d.source, d.target) + 360) % 360;
			const mirror = angle > 90 && angle < 270;
			const center = { x: 0, y: 0 };
			const n = this.unitaryNormalVector(d.source, d.target);
			const nWeight = mirror ? 2 : -3;
			const point = {
				x: (d.target.x - d.source.x) * 0.5 + n.x * nWeight,
				y: (d.target.y - d.source.y) * 0.5 + n.y * nWeight
			};
			const rotatedPoint = this.rotatePoint(center, point, angle);

			return `translate(${rotatedPoint.x}, ${rotatedPoint.y})` + `rotate(${mirror ? 180 : 0})`;
		});
	}

	toString(d) {
		let s = d.labels ? d.labels[0] : d.type;
		s += ` (<id>: ${d.id}`;

		Object.keys(d.properties).forEach(function (property) {
			s += `, ${property}: ${JSON.stringify(d.properties[property])}`;
		});

		s += ")";
		return s;
	}

	unitaryNormalVector(source, target, newLength = 1) {
		const center = { x: 0, y: 0 };
		const vector = this.unitaryVector(source, target, newLength);
		return this.rotatePoint(center, vector, 90);
	}

	unitaryVector(source, target, newLength = 1) {
		const a2 = Math.pow(target.x - source.x, 2);
		const b2 = Math.pow(target.y - source.y, 2);
		const length = Math.sqrt(a2 + b2) / Math.sqrt(newLength);

		return {
			x: (target.x - source.x) / length,
			y: (target.y - source.y) / length
		};
	}

	updateWithD3Data(d3Data) {
		this.updateNodesAndRelationships(d3Data.nodes, d3Data.relationships);
	}

	/**
	 * Update the graph with new nodes and relationships from an object
	 * containing data in the neo4j format.
	 * @param {Object} neo4jData The neo4j data object.
	 */
	updateWithNeo4jData(neo4jData) {
		const d3Data = this.neo4jDataToD3Data(neo4jData);
		this.updateWithD3Data(d3Data);
	}

	updateInfo(d) {
		this.clearInfo();

		if (d.labels) {
			this.appendInfoElementClass("class", d.labels[0]);
		} else {
			this.appendInfoElementRelationship("class", d.type);
		}

		this.appendInfoElementProperty("property", "&lt;id&gt;", d.id);

		Object.keys(d.properties).forEach((property) => {
			const value = d.properties[property];
			if (this.options.showNullProperties || Boolean(value)) {
				this.appendInfoElementProperty("property", property, JSON.stringify(value));
			}
		});
	}

	updateNodes(n) {
		Array.prototype.push.apply(this.nodes, n);
		this.node = this.svgNodes.selectAll(".node").data(this.nodes, (d) => d.id);

		const nodeEnter = this.appendNodeToGraph();
		this.node = nodeEnter.merge(this.node);
	}

	updateNodesAndRelationships(n, r) {
		this.updateRelationships(r);
		this.updateNodes(n);

		this.simulation.nodes(this.nodes);
		this.simulation.force("link").links(this.relationships);
	}

	updateRelationships(r) {
		Array.prototype.push.apply(this.relationships, r);
		this.relationship = this.svgRelationships
			.selectAll(".relationship")
			.data(this.relationships, (d) => d.id);

		const relationshipEnter = this.appendRelationshipToGraph();
		this.relationship = relationshipEnter.relationship.merge(this.relationship);

		this.relationshipOutline = this.svg.selectAll(".relationship .outline");
		this.relationshipOutline = relationshipEnter.outline.merge(this.relationshipOutline);

		this.relationshipOverlay = this.svg.selectAll(".relationship .overlay");
		this.relationshipOverlay = relationshipEnter.overlay.merge(this.relationshipOverlay);

		this.relationshipText = this.svg.selectAll(".relationship .text");
		this.relationshipText = relationshipEnter.text.merge(this.relationshipText);
	}

	zoomFit(_transitionDuration) {
		const bounds = this.svg.node().getBBox();
		const parent = this.svg.node().parentElement.parentElement;
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

		this.svgScale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
		this.svgTranslate = [
			fullWidth / 2 - this.svgScale * midX,
			fullHeight / 2 - this.svgScale * midY
		];

		this.svg.attr(
			"transform",
			`translate(${this.svgTranslate[0]}, ${this.svgTranslate[1]}) scale(${this.svgScale})`
		);
	}
}

export default Neo4jD3;
