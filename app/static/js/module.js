// Global variables for dynamic network visualization of regulatory gene networks (Bayesian network)
// Aproach is based on:
// https://bl.ocks.org/mbostock/1095795
// https://bl.ocks.org/mbostock/950642
// https://bl.ocks.org/mbostock/1129492

var height = 600;
var width = 960;
var radius = 5;

// Init svg canvas
var svg = d3.select("#rgn").append("svg")
	.attr("width", width)
	.attr("height", height);

var color = d3.scaleOrdinal(d3.schemeCategory10);

// Variables storing current nodes and links
var nodes = [];
var links = [];

// Force layout simulation
var simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("link", d3.forceLink(links).distance(20))
    .force("gravity", d3.forceManyBody().strength(20))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // .alphaTarget(1)
    .on("tick", ticked);

// Declare D3 selections available to updateNetwork()
var svg_group = svg.append("g");

var link = svg_group.append("g")
    	.attr("stroke", "#000")
    	.attr("stroke-width", 1.0)
    	.selectAll(".link");

// Network nodes containing circle with href span and a node label
var node = svg_group.append("g")
    	// .attr("stroke", "#fff")
    	// .attr("stroke-width", 1.0)
    	.selectAll(".node");

// update network based on nodes and links objects
function updateNetwork() {

	// Apply the general update pattern to the nodes.
	node = node.data(nodes, function(d) { return d.id;});
	node.exit().remove();

	var node_new = node.enter().append("g")
		.attr("class", "node");


	var circle = node_new.append("a")
		// link when clicking nodes
		.attr("xling:href", function(d) {
			var elems = d.id.split("_");
			var ensembl = elems[2].split(".")[0];
			return "/gene/" + ensembl;
		})
		.append("circle")
			.attr("fill", function(d) { return color(d.id); })
			.attr("r", radius)
			.on("mouseover", function(d) {
				console.log(d);
			});

	var label = node_new.append("text")
		.attr("text-anchor", "middle")
		.attr("dy", "-0.5em")
		.style("font-size", "10px")
		.style("fill", "rgb(100,100,100)")
		.style("stroke", "none")
		.text(function(d) {
			var elems = d.id.split("_");
			return elems[1];
		});

	node = node_new.merge(node);


	// Apply the general update pattern to the links.
	link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
	link.exit().remove();
	link = link.enter().append("line").merge(link);

	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1).restart();
}

function ticked() {
	// circle
	node.selectAll("circle")
		// Bounded by svg box
		.attr("cx", function(d) { return Math.max(radius, Math.min(width - radius, d.x)); })
		.attr("cy", function(d) { return Math.max(radius, Math.min(height - radius, d.y)); });

	// label
	node.selectAll("text")
		.attr("x", function(d) {return d.x; })
		.attr("y", function(d) {return d.y; });

	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}


$(document).ready(function() {
	// Get genes found in module
	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		renderModulePie(data);
		renderModuleTable(data);
	});

	// Get phenotype associations
	$.get('/api/pheno',
		{k: input.mod_id}
	).done(function(data) {
		renderPhenoAssoc(data);
	});

	// Get Bayesian network
	url = "/static/data/rgn/" + input.mod_id + ".csv";
	$.get(url)
		.done(function(data) {
			// Parse data
			data = $.csv.toObjects(data);

			var fdr_cutoff = calcFdrCutoff(data);

			renderSlider(data, fdr_cutoff);

			// Render network
			setNetwork(data, fdr_cutoff);
			updateNetwork();
		}
	);

	// Get GO enrichment tables
	$.get('/api/go',
		{k: input.mod_id, subtree: 'BP'}
	).done(function(data) {
		renderTableGO(data, '#go_bp_table');
	});

	// CC
	$.get('/api/go',
		{k: input.mod_id, subtree: 'CC'}
	).done(function(data) {
		renderTableGO(data, '#go_cc_table');
	});

	// MF
	$.get('/api/go',
		{k: input.mod_id, subtree: 'MF'}
	).done(function(data) {
		renderTableGO(data, '#go_mf_table');
	});

	// Key driver analysis
	$.get('/api/kda',
		{k: input.mod_id}
	).done(function(data) {
		// console.log(data);
		renderTableKDA(data);
	});

});

var brewer_pastel1 = [
	'rgb(251,180,174)',
	'rgb(179,205,227)',
	'rgb(204,235,197)',
	'rgb(222,203,228)',
	'rgb(254,217,166)',
	'rgb(229,216,189)',
	'rgb(253,218,236)'
]

function renderModulePie(data) {
	// Specify order of tissues for plotting
	var tissue_order = ['AOR', 'MAM', 'VAF', 'SF', 'BLOOD', 'LIV', 'SKLM'];

	// Count transcripts from certain tissues
	// get array of transcript tissues
	var tissue = data.map(function(row) {
		return row['tissue']
	})
	var tissue_counts = _.countBy(tissue);

	// Reorder counts based on tissue_order
	var tissue_counts_ordered = tissue_order.map(function(t) {
		return tissue_counts[t];
	});

	pie_data = [{
		values: tissue_counts_ordered,
		labels: tissue_order,
		type: 'pie',
		sort: false,  // dont reorder and recolor tissues
		hole: .4,
		marker: {
			// colors: brewer_pastel1
			// outline color
			line: {
				color: 'rgba(50, 50, 50, 1.0)',
				width: 1
		    },
		}
	}];

	Plotly.newPlot('tissue_pie', pie_data)
}

function renderModuleTable(data) {
	var columns = Object.keys(data[0]);

	var gene_col_index = columns.indexOf('ensembl');

	var config = {
		column_order: [
			'tissue',
			'ensembl',
			'gene_symbol',
			'clust'
		],
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(gene, type, row) {
				return "<a href='/gene/" + gene + "'>" + gene + "</a>";
			},
			targets: 'ensembl'
		}]
	};

	renderTable(data, '#mod_table', config);
}

function renderPhenoAssoc(data) {
	var max_logp = 100;

	// Remove cluster column if present
	data = filterColumns(data, 'clust', 'exclude');

	// dict to array of dict
	data = Object.keys(data[0]).map(function(key) {
		return { type: key, pval: data[0][key]}; 
	});

	// Sort by p-values
	data = _.sortBy(data, function(d) {return d.pval}).reverse();

	// calculate -log10 p values, capped at specified maximum
	// alters data object
	data.map(function(d) {
		d.logp = Math.min(-Math.log10(d.pval), max_logp);
	})


	var plot_data = [{
	  type: 'scatter',
	  x: data.map(function(d) {return d.logp}),
	  y: data.map(function(d) {return d.type}),
	  mode: 'markers',
	  // name: 'Percent of estimated voting age population',
	  marker: {
		// color: 'rgba(156, 165, 196, 0.95)',
		color: 'rgba(179, 205, 227, 1.00)',
		line: {
			// color: 'rgba(156, 165, 196, 1.0)',
			color: 'rgba(50, 50, 50, 1.0)',
			width: 1
	    },
			symbol: 'circle',
			size: 12
		}
	}];

	var layout = {
	  // title: 'Votes cast for ten lowest voting age population in OECD countries',
	  xaxis: {
	  	title: '-log10 p',
	    showgrid: false,
	    showline: true,
	    linecolor: 'rgb(102, 102, 102)',
	    titlefont: {
	      font: {
	        color: 'rgb(204, 204, 204)'
	      }
	    },
	    tickfont: {
	      font: {
	        color: 'rgb(102, 102, 102)'
	      }
	    },
	    autotick: false,
	    dtick: 10,
	    ticks: 'outside',
	    tickcolor: 'rgb(102, 102, 102)'
	  },
	  margin: {
	    l: 140,
	    r: 40,
	    b: 50,
	    t: 80
	  },
	  legend: {
	    font: {
	      size: 10,
	    },
	    yanchor: 'middle',
	    xanchor: 'right'
	  },
	  width: 600,
	  height: 600,
	  // paper_bgcolor: 'rgb(254, 247, 234)',
	  // plot_bgcolor: 'rgb(254, 247, 234)',
	  hovermode: 'closest'
	};


	Plotly.newPlot('pheno_assoc', plot_data, layout);
}

function renderTableGO(data, dom_sel) {

	var config = {
		column_order: [
			'termID',
			'termName',
			'termDefinition',
			'enrichmentP',
			'BonferoniP'
		],
		num_cols: [
			'enrichmentP',
			'BonferoniP'
		],
		orderby: 'enrichmentP',
		precision: 5,
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5']
	};

	renderTable(data, dom_sel, config);
}

function renderTableKDA(data) {
	var config = {
		column_order: [
			'ensembl',
			'tissue',
			'gene',
			'P',
			'FDR'
		],
		num_cols: [
			'P',
			'FDR'
		],
		precision: 5,
		orderby: 'P',
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(gene, type, row) {
				return "<a href='/gene/" + gene + "'>" + gene + "</a>";
			},
			targets: 'ensembl'
		}]
	};

	renderTable(data, "#kda_table", config);
}

function calcFdrCutoff(data) {
	// Calculate default selection
	// Filter edges based on number of edges that can be shown
	// Default filtering, can be changed by slider.
	var max_edges = 300;
	if (data.length > max_edges) {
		// Assumes that edges data is ordered by kda_FDR
		var fdr_cutoff = data[max_edges - 1].kda_FDR
	} else {
		var fdr_cutoff = 1.0;  // show all
	}

	return(fdr_cutoff)
}

// extended from example at
// https://bl.ocks.org/johnwalley/e1d256b81e51da68f7feb632a53c3518
function renderSlider(data, fdr_cutoff) {
	// log transformed FDR values
	var fdr_vals = data.map(function(d) { return -Math.log10(d.kda_FDR); })

	var slider = d3.sliderHorizontal()
		.min(d3.min(fdr_vals))
		.max(d3.max(fdr_vals))
		.width(300)
		.tickFormat(d3.format('.3s'))
		.ticks(5)
		.default(-Math.log10(fdr_cutoff))
		.on('onchange', function(val) {
			setNetwork(data, Math.pow(10, -val));
			updateNetwork();
		});

	var g = d3.select("div#rgn_slider").append("svg")
		.attr("width", 500)
		.attr("height", 100)
		.append("g")
		.attr("transform", "translate(30,30)");

	g.call(slider);

	// Label
	g.append("text")
		.attr("x", 65)
		.attr("y", -10)
		.style("font-size", "12px")
		.style("fill", "grey")
		.text("Key driver analysis (-log10 FDR)");
}



// Updates state variables of dynamic networks
function setNetwork(edges, fdr_cutoff) {

	// filter edges if fdr_cutoff is provided
	if (fdr_cutoff !== undefined) {
		// Filter edges
		edges = edges.filter(function(elem) {
			return Number(elem.kda_FDR) < Number(fdr_cutoff);
		});
	}

	var nodes_from = edges.map(function(d) {return d.source; });
	var nodes_to = edges.map(function(d) {return d.target; });

	// Get nodes as array if ids
	// desired node array
	var new_nodes = _.unique(nodes_from.concat(nodes_to));

	// Get array of existing node ids
	var node_ids = nodes.map(function(d) { return d.id })

	// Only add new nodes
	var add_nodes = _.difference(new_nodes, node_ids);

	// remove nodes previously in network that are not specified
	var del_nodes = _.difference(node_ids, new_nodes);
	// console.log("Removing : ", del_nodes);

	// delete nodes globally
	del_nodes.map(function(id) {
		index = nodes.findIndex(function(d) {return d.id === id; })

		nodes.splice(index, 1);  // delete from array
	})

	// Convert to node format, such that new nodes can be added
	add_nodes = add_nodes.map(function(d) { return {id: d }; })

	// Add new nodes permanently to global node variable
	nodes = nodes.concat(add_nodes);

	// get list of references to nodes array
	// Edges only work if they are passed (by reference?) with respect to
	// the objects in the global nodes variable
	var new_edges = edges.map(function(edge) {
		// Get current node indices of source and target 
		var source_index = nodes.findIndex(function(d) { return d.id === edge.source; });
		var target_index = nodes.findIndex(function(d) { return d.id === edge.target; });

		return {source: nodes[source_index], target: nodes[target_index]}
	});

	// Overwrite previous edges
	links = new_edges;
}

// Generates unique string ID for network edges
function edgeID(edge) {
	// console.log(edge);
	return edge.source.id + "-" + edge.target.id;
}

// Old function for rendering static network
// var nodes = [];
// var edges_filter = [];
function renderRGN(edges) {
	// console.log(edges);

	var height = 600;
	var width = 960;

	// Init network layout simulation
	var simulation = d3.forceSimulation()
	    .force("link", d3.forceLink().id(function(d) { return d.id; }))
	    .force("charge", d3.forceManyBody())
	    .force("gravity", d3.forceManyBody().strength(10))
	    .force("center", d3.forceCenter(width / 2, height / 2));

	// Init svg canvas
	var svg = d3.select("#rgn").append("svg")
		.attr("width", width)
		.attr("height", height);

	var line = svg.append("g")
		.attr("id", "links")
		.attr("class", "links");

	var node = svg.append("g")
		.attr("id", "nodes")
		.attr("class", "nodes");

	function ticked() {
	  link
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	  node
	      .attr("cx", function(d) { return Math.max(radius, Math.min(width - radius, d.x)); })
	      .attr("cy", function(d) { return Math.max(radius, Math.min(height - radius, d.y)); });
	}

	fdr_cutoff = calcFdrCutoff(edges)
	renderNetwork(svg, simulation, edges, fdr_cutoff);
}


// Old function for rendering static network
function renderNetwork(svg, simulation, edges, fdr_cutoff=undefined) {
	var radius = 5;

	// Get svg dimensions
	var width = svg.style("width").replace("px", "");
	var height = svg.style("height").replace("px", "");


	if (fdr_cutoff !== undefined) {
		// Filter edges
		edges_filter = edges.filter(function(elem) {
			return Number(elem.kda_FDR) < Number(fdr_cutoff);
		});
	} else {
		edges_filter = edges;
	}

	var nodes_from = edges_filter.map(function(d) {return d.source; });
	var nodes_to = edges_filter.map(function(d) {return d.target; });

	var nodes = _.unique(nodes_from.concat(nodes_to));

	nodes = nodes.map(function(d) { return {id: d }; })


	var link = svg.select("#links")
		.selectAll("line")
		.data(edges_filter)
		.enter().append("line")
			.attr("stroke-width", 2);

	var node = svg.select("#nodes")
		.selectAll("circles")
		.data(nodes)
		.enter().append("circle")
			.attr("r", radius)
			.attr("fill", "black")
			.call(d3.drag()
			    .on("start", dragstarted)
			    .on("drag", dragged)
			    .on("end", dragended));

	simulation
		.nodes(nodes)
		.on("tick", ticked);

	simulation.force("link")
		.links(edges_filter);

	function ticked() {
	  link
	      .attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

	  node
	      .attr("cx", function(d) { return Math.max(radius, Math.min(width - radius, d.x)); })
	      .attr("cy", function(d) { return Math.max(radius, Math.min(height - radius, d.y)); });
	}

	// Dragging functions
	function dragstarted(d) {
		if (!d3.event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		if (!d3.event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}


