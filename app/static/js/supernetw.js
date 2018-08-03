// Interactive eigengene supernetwork
// id: DOM identifier of <div> to load
function superNetwork(data, id) {
	// console.log(data);
	// d3.select(id).text(JSON.stringify(data));

	// Plot dimensions
	var width = 800,
		height = 800;

	var margin = 30;  // px

	var svg = d3.select(id).append('svg')
		.attr('width', width)
		.attr('height', height);

	// Scales
	var max_x = _.max(data.layout.map(function(d) {return d.x}));
	var max_y = _.max(data.layout.map(function(d) {return d.y}));

	var xscale = d3.scaleLinear()
		.domain([0, max_x])  // input domain
		.range([margin, width - margin]);

	var yscale = d3.scaleLinear()
		.domain([0, max_y])  // input domain
		.range([height - margin, margin]);  // inverted y-axis

	// Color circles based on annotation feature
	// assumes that the data object is available in scope
	function colorCircles(circle, feature, transform) {
		// find max value for scaling
		var max_val = _.max(data.annot.map(function(d) {
			return transform(d[feature]);
		}))

		circle.style("fill", function(d) {
			var val = data.annot[d.module - 1][feature];
			var frac = transform(val) / max_val;
			// return d3.interpolateGreens(frac);
			return d3.interpolateYlGnBu(frac);
		});
	}

	// Select dropdown callback function
	d3.select("#annot_opts").on("change", function() {
		var selected_value = d3.select("#annot_opts").property("value")
		colorCircles(circle, selected_value, neglog10);
	});

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


    // build arrows
    // see http://bl.ocks.org/d3noob/5141278 for adding data bindings
    svg.append("svg:defs")
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
	var focus_marker = svg.append("svg:defs")
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
	var line = svg.selectAll("line")
		.data(edges)
		.enter().append("line")
			.attr("x1", function(d) { return xscale(d.source.x); })
			.attr("y1", function(d) { return yscale(d.source.y); })
			.attr("x2", function(d) { return xscale(d.target.x); })
			.attr("y2", function(d) { return yscale(d.target.y); })
			.attr("marker-end", "url(#subtle)");  // set customly defined arrow head

	// references focus which is defined below
	// var circle = svg.append("g").selectAll("circle")
	var circle = svg.selectAll("circle")
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

	// text information when hovering over nodes
	var focus = svg.append("g")
		.style("display", "none");

	focus.append("text")
		// relative position of hover text
		.attr("text-anchor", "middle")
		.style("fill", "black")
		.attr("dy", "-1em");
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