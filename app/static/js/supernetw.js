// Interactive eigengene supernetwork
// id: DOM identifier of <div> to load
function superNetwork(data, id) {
	console.log(data);
	// d3.select(id).text(JSON.stringify(data));

	// Plot dimensions
	var width = 800,
		height = 800;

	var margin = 10;  // px

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
	var line = svg.append("g").selectAll("line")
		.data(edges)
		.enter().append("line")
			.attr("x1", function(d) { return xscale(d.source.x); })
			.attr("y1", function(d) { return yscale(d.source.y); })
			.attr("x2", function(d) { return xscale(d.target.x); })
			.attr("y2", function(d) { return yscale(d.target.y); })
			.attr("marker-end", "url(#end)");


	var circle = svg.append("g").selectAll("circle")
		.data(data.layout)
		.enter().append("circle")
			.attr("cx", function(d) {return xscale(d.x)})
			.attr("cy", function(d) {return yscale(d.y)})
			.attr("r", 3);


	// var path = svg.append("g").selectAll("path")
	// 	.data(edges)
	// 	.enter().append("path")
	// 		.attr("d", linkArc);

	// function linkArc(d) {
	// 	var dx = xscale(d.target.x) - xscale(d.source.x),
	// 		dy = yscale(d.target.y) - yscale(d.source.y),
	// 		dr = Math.sqrt(dx * dx + dy * dy);
	// 	return "M" + xscale(d.source.x) + "," + yscale(d.source.y) + "A" + dr + "," + dr + " 0 0,1 " + xscale(d.target.x) + "," + yscale(d.target.y);
	// }
}