// Interactive eigengene supernetwork
// id: DOM identifier of <div> to load
function superNetwork(data, id) {
	console.log(data);
	// d3.select(id).text(JSON.stringify(data));

	// Plot dimensions
	var width = 800,
		height = 800;

	var margin = 50;  // px

	var svg = d3.select(id).append('svg')
		.attr('width', width)
		.attr('height', height);

	// Scales
	var max_x = _.max(data.layout.map(function(d) {return d.x}));
	var max_y = _.max(data.layout.map(function(d) {return d.y}));

	var scale = _.min([width / max_x, height / max_y]);

	var xscale = d3.scaleLinear()
		.domain([0, max_x])  // input domain
		.range([margin, width - margin]);

	var yscale = d3.scaleLinear()
		.domain([0, max_y])  // input domain
		.range([height - margin, margin]);  // inverted y-axis


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
			.attr("id", "end")
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 15)
			.attr("refY", 0.0)
			.attr("markerWidth", 5)
			.attr("markerHeight", 5)
			.attr("orient", "auto")
		.append("svg:path")
			.attr("d", "M0,-5L10,0L0,5")
			.style("fill", "rgb(180,180,180)");


	// add lines for edges 
	// var line = svg.append("g").selectAll("line")
	var line = svg.selectAll("line")
		.data(edges)
		.enter().append("line")
			.attr("x1", function(d) { return xscale(d.source.x); })
			.attr("y1", function(d) { return yscale(d.source.y); })
			.attr("x2", function(d) { return xscale(d.target.x); })
			.attr("y2", function(d) { return yscale(d.target.y); })
			.attr("marker-end", "url(#end)");

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
				d3.select(this).style("fill", "rgb(251,180,174)")
					.style("r", 7);

				// highlight edges
				line.filter(
					function(e) {
						return e.source.id.toString() === d.module.toString() ||
							e.target.id.toString() === d.module.toString();
					})
					.style('stroke', 'black')
						.moveToFront();

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
			})
			.on("mouseout", function(d) {
				// reset circle and text
				d3.select(this).style("fill", null);
				d3.select(this).style("r", 5);
				focus.style("display", "none");  // hide
				line.style('stroke', null);  // reset
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