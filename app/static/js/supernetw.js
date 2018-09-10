// Used for tooltip
var tissue_description = {
	"AOR": "Atherosclerotic aortic root",
	"MAM": "Lesion-free internal mammary artery",
	"VAF": "Visceral abdominal fat",
	"SF": "Subcutaneous fat",
	"BLOOD": "Whole blood",
	"LIV": "Liver",
	"SKLM": "Skeletal muscle",
	"Cross-tissue": ">5% transcripts from heterogenous tissues"
};



// Interactive eigengene supernetwork class
// id: DOM identifier of <div> to load
class SuperNetwork {
	constructor(data, id, width=800, height=800) {

		this.data = data;  // store network data in object

		// Plot dimensions
		this.width = width;
		this.height = height;

		var margin = 30;  // px

		this.svg = d3.select(id).append('svg')
			.attr('width', this.width)
			.attr('height', this.height);

		// background rect for catching click events
		this.svg.append("rect")
			.attr("id", "zoom_rect")
			.attr("width", width)
			.attr("height", height)
			.style("fill", "none")
			.style("pointer-events", "all");

		// Scales
		var max_x = _.max(data.layout.map(function(d) {return d.x}));
		var max_y = _.max(data.layout.map(function(d) {return d.y}));

		var xscale = d3.scaleLinear()
			.domain([0, max_x])  // input domain
			.range([margin, this.width - margin]);

		var yscale = d3.scaleLinear()
			.domain([0, max_y])  // input domain
			.range([this.height - margin, margin]);  // inverted y-axis

		// Include edge data in edges			
		var edges = data.edges.map(function(e) {
			return {
				source: {
					id: e[0],
					x: data.layout[e[0] - 1].x,  // 0-indexed
					y: data.layout[e[0] - 1].y
				},
				target: {
					id: e[1],
					x: data.layout[e[1] - 1].x,
					y: data.layout[e[1] - 1].y
				}
			}
		});


		// Fixed tissue labels
		// Data for static tissue labels, relative positionings
		var tissue_labels = [
			{
				tissue: "AOR",
				x: 4.5,
				y: 12.5
			},
			{
				tissue: "MAM",
				x: 9.0,
				y: 19.0
			},
			{
				tissue: "VAF",
				x: 9.0,
				y: 0.8
			},
			{
				tissue: "SF",
				x: 14.0,
				y: 1.5
			},
			{
				tissue: "BLOOD",
				x: 22.0,
				y: 11.2
			},
			{
				tissue: "LIV",
				x: 21.0,
				y: 6.0
			},
			{
				tissue: "SKLM",
				x: 2.0,
				y: 3.5
			}
		];

		// Add text labels to plot describing tissue clusters
		this.svg.selectAll(".tissue_label")
			.data(tissue_labels)
			.enter().append("text")
				.attr("x", function(d) {
					return xscale(d.x);
				})
				.attr("y", function(d) {
					return yscale(d.y);
				})
				.style("fill", "grey")
				.text(function(d) {
					return d.tissue;
				});

	    // build arrows
	    // see http://bl.ocks.org/d3noob/5141278 for adding data bindings
	    this.svg.append("svg:defs")
	 		.append("svg:marker")    // This section adds in the arrows
				.attr("id", "subtle")  // 
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 15)
				.attr("refY", 0.0)
				.attr("markerWidth", 5)
				.attr("markerHeight", 5)
				.attr("orient", "auto")
			.append("svg:path")
				.attr("d", "M0,-5L10,0L0,5")
				.style("fill", "rgb(180,180,180)");

		// arrow head definition on focus
		// Used for changing colors of edge arrow heads
		var focus_marker = this.svg.append("svg:defs")
			.append("svg:marker")
				.attr("id", "focus")
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 15)
				.attr("refY", 0.0)
				.attr("markerWidth", 5)
				.attr("markerHeight", 5)
				.attr("orient", "auto")
			.append("svg:path")
				.attr("d", "M0,-5L10,0L0,5")
				.style("fill", "rgb(0,0,0)");

		// add lines for edges 
		var line = this.svg.selectAll("line")
			.data(edges)
			.enter().append("line")
				.attr("x1", function(d) { return xscale(d.source.x); })
				.attr("y1", function(d) { return yscale(d.source.y); })
				.attr("x2", function(d) { return xscale(d.target.x); })
				.attr("y2", function(d) { return yscale(d.target.y); })
				.attr("marker-end", "url(#subtle)");  // set customly defined arrow head

		// references focus which is defined below
		var circle = this.svg.selectAll("circle")
			.data(data.layout)
			.enter().append("a")
				// goto module page on click
				.attr("xlink:href", function(d) {return "/module/" + d.module})

				.append("circle")
				.attr("cx", function(d) {return xscale(d.x); })
				.attr("cy", function(d) {return yscale(d.y); })
				.attr("r", 5)  // radius

				.on("mouseover", function(d) {
					// change circle color and shape
					d3.select(this)
						// .style("fill", "rgb(77,175,74)")
						.style("r", 7);

					// get node color of hover circle
					var node_color = d3.select(this).style("fill");

					// highlight edges
					line.filter(
						// does edge go to or from circle node?
						function(e) {
							return e.source.id.toString() === d.module.toString() ||
								e.target.id.toString() === d.module.toString();
						})
						.style('stroke', 'rgb(228,26,28)')
						// .style("stroke", node_color)
						.attr("marker-end", "url(#focus)")  // set arrow head to focus def
						.moveToFront();  // show above other elements

					// change color of focus marker-end to that of hover circle
					// focus_marker.style("fill", node_color);
					focus_marker.style("fill", 'rgb(228,26,28)');

					// Move a > circle to front, over the highlighted lines
					d3.select(this.parentNode).moveToFront();

					// find neighboring nodes
					var neigh = neighbors(d.module.toString(), data);

					// move a > circle of neighbors to top
					circle.filter(function(d_sub) {
							return neigh.includes(d_sub.module.toString());  // returns boolean for kth modules is contained in neighbor array
						})
						.each(function() {
							d3.select(this.parentNode).moveToFront();
						});

					// position and show module ID text
					focus.attr("transform", "translate(" + xscale(d.x) + "," + yscale(d.y) + ")");
					focus.select("text").text(d.module);
					focus.style("display", null);  // show
					focus.moveToFront();
				})
				.on("mouseout", function(d) {
					// reset circle and text
					// d3.select(this).style("fill", null);
					d3.select(this).style("r", 5);
					focus.style("display", "none");  // hide
					line.style("stroke", null);  // reset
					line.attr("marker-end", "url(#subtle)");  // reset arrow heads
					line.moveToBack();  // move all lines (including highlights) to back
				});

		// store circle reference in object.
		// Done  after initializations fue to circular initilization definition.
		this.circle = circle;

		// text information when hovering over nodes
		var focus = this.svg.append("g")
			.style("display", "none");

		// translucent box to ensure text contrast
		focus.append("rect")
			.attr("width", "2em")
			.attr("height", "1.2em")
			.attr("y", "-2em")
			.attr("x", "-1em")
			.attr("rx", 5)  // round edges
			.style("fill", "rgba(200,200,200,0.7)");

		focus.append("text")
			// relative position of hover text
			.attr("text-anchor", "middle")
			.style("fill", "black")
			.attr("dy", "-1em");

		// Legend color gradients
		var ncolors = 10;
		var colors = d3.range(ncolors).map(function(val) { return d3.interpolateYlGnBu(val / ncolors); })
		// Define color gradient scale
		this.svg.append("defs").append("linearGradient")
			.attr("id", "color-gradient-ylgnbu")
			.attr("x1", "0%").attr("y1", "0%")
			.attr("x2", "100%").attr("y2", "0%")
			.selectAll("stop") 
			.data(colors)                  
			.enter().append("stop") 
			.attr("offset", function(d,i) { return i/(colors.length - 1); })   
			.attr("stop-color", function(d) { return d; });

	}

	// SuperNetwork methods
	// ---------------------------------------------------------

	// Color circles based on annotation feature
	// assumes that the data object and svg is in scope
	colorCircles(feature, transform, label="-log10 p") {
		var data = this.data;  // for use 'outside' SuperNetwork class

		this.clearLegend();

		if (feature === "Tissue") {
			var tissue_order = ['AOR', 'MAM', 'VAF', 'SF', 'BLOOD', 'LIV', 'SKLM', 'Cross-tissue'];
			// Ordinal color scale
			// Reorder colors
			var colors = [0, 4, 3, 7, 1, 6, 2].map(function(i) {
				return d3.schemeSet1[i];
			});

			colors.push("white");  // cross-tissue

			this.circle.style("fill", function(d) {
				// get value for nominal feature (tissue)
				var val = data.annot[d.module - 1][feature];
				var index = tissue_order.indexOf(val);
				return colors[index];
			});

			this.renderTissueLegend(tissue_order, colors);

		} else {
			// find max value for scaling
			var max_val = _.max(data.annot.map(function(d) {
				return transform(d[feature]);
			}));

			this.circle.style("fill", function(d) {
				var val = transform(data.annot[d.module - 1][feature]);
				// Default value when undefined
				if (val === undefined) {
					val = 0;
				}
				var frac = val / max_val;

				// return d3.interpolateGreens(frac);
				return d3.interpolateYlGnBu(frac);
				// return d3.interpolateRainbow(frac);
			});

			this.renderGradientLegend(max_val, label);
		}
	}


	// Color supernetork nodes based on tissue search
	// Only supports one color per module
	// tissue_search: [{gene_tissue: , module: }]
	// as returned by /api/in-module?q=gene
	colorCirclesTissueSearch(tissue_search) {
		// format search data to arrays
		var found_modules = tissue_search.map(function(d) {return d.module});
		var found_tissues = tissue_search.map(function(d) {return d.gene_tissue});

		// Ordinal tissue color scale
		var tissue_order = ['AOR', 'MAM', 'VAF', 'SF', 'BLOOD', 'LIV', 'SKLM'];
		var colors = d3.schemeCategory10;

		// Color circles
		this.circle.style("fill", function(d) {
			// get tissue if any
			var tissue = found_tissues[found_modules.indexOf(d.module)];

			var col_index = tissue_order.indexOf(tissue);
			return colors[col_index];
		});

		// Tissue color legend
		this.renderLegend(tissue_order, colors);
	}

	renderTissueLegend(label_order, colors) {
		// add legend
		var legend = this.svg.append("g")
			.attr("id", "legend")
			.attr("height", 100)
			.attr("width", 100)
			// .attr('transform', 'translate(700,20)');
			.attr('transform', 'translate(' + (this.width - 100) + ',20)');


		var legend_line_width = 14;
		// bind legend to
		legend.selectAll("circle")
			.data(label_order).enter()
			.append("circle")
				.attr("r", 5)
				.attr("cx", 0)
				.attr("cy", function(d, i) {
					return i * legend_line_width;
				})
				.style("fill", function(d, i) {
					return colors[i];
				})
				.style("stroke", "rgb(125,125,125)");

		// adjacent text
		legend.selectAll("text")
			.data(label_order).enter()
			.append("text")
				.attr("x", 10)
				.attr("y", function(d, i) {
					return i * legend_line_width + 4;
				})
				.style("font-size", "14px")
				.text(function(d) {return d;})
				// html tooltip on hover explaining tissue codes
				.append("svg:title").text(function(d) {
					return tissue_description[d];
				});

	}

	// render color gradient with ticks ranging [0, max_val]
	renderGradientLegend(max_val, label) {
		// Generate colors from sequence of numbers sequence
		var gradient_width = 200;
		var gradient_height = 10;

		// set up color scale. Centered at x=0
		var xscaleColor = d3.scaleLinear()
			.domain([0, max_val])
			.range([-gradient_width / 2, gradient_width / 2]);

		// Define x-axis
		var legendAxis = d3.axisBottom()
			.ticks(5)
			.scale(xscaleColor);

		// Position legend
		var legend = this.svg.append("g")
			.attr("id", "legend")
			.attr('transform', 'translate(' + (this.width - 100) + ',20)');

		// Color interpolated gradient as rectangle
		legend.append("rect")
			.attr("x", -gradient_width/2)
			.attr("y", 0)
			.attr("width", gradient_width)
			.attr("height", gradient_height)
			.style("fill", "url(#color-gradient-ylgnbu)");

		// axis indication
		legend.append("g")
			.attr("class", "legend_axis")
			.attr("transform", "translate(0,10)")
			.call(legendAxis)

		// Label
		legend.append("text")
			.style("text-anchor", "middle")
			.attr("x", 0)
			.attr("y", gradient_height + 30)
			.style("font-size", "12px")
			.text(label);
	}

	clearLegend() {
		d3.select("#legend").remove();
	}

	// Adds annotation feature data
	addAnnotationData(new_data) {
		var clust_ids = this.data.annot.map(function(d) { return d.clust });

		// merge each module entry by clust ids
		this.data.annot = _.map(this.data.annot, function(item){
		    return _.extend(item, _.findWhere(new_data, { clust: item.clust }));
		});
	}
}


// -log10 p, capped at min p = 1e-16
function neglog10(x) {
	// return Math.min(-Math.log10(x), 16);
	return Math.min(-Math.log10(x), 32);
}


// Reorder svg elements within parent object -- such as 'g'
// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

// Find neighboring nodes to the kth node
// returns array of neighbors
function neighbors(k, data) {

	// find neighboring node of kth node
	// returns null if edge does not involve kth node
	var nodes = data.edges.map(function(e) {
		if (e[0] == k) {
			return e[1];
		} else if (e[1] == k) {
			return e[0];
		} else {
			return null;
		}
	});

	// filter out eges not involving k
	nodes = nodes.filter(function(k) {
		return k !== null;
	});

	return nodes;
}

