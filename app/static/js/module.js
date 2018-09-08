// Enable bootstrap tooltips
$(function () {
	$('[data-toggle="tooltip"]').tooltip({trigger: "click"});
})

// Global variables for dynamic network visualization of regulatory gene networks (Bayesian network)
// Aproach is based on:
// https://bl.ocks.org/mbostock/1095795
// https://bl.ocks.org/mbostock/950642
// https://bl.ocks.org/mbostock/1129492

// Order of tissues for color scale
var tissue_order = ['AOR', 'MAM', 'VAF', 'SF', 'BLOOD', 'LIV', 'SKLM', 'Cross-tissue'];
var colors = d3.schemeCategory10;

// Bayesian netork with global variables
// ------------------------------------------------
var rgn_height = 600;
var rgn_width = 960;
var radius = 5;

var node_color_by = "Tissue";  // which feature to color nodes by
var nodeColorScale = null;  // set by setNodeColorScheme()
var annot = null;  // dictionary of node annotation data

// Init svg canvas
var svg = d3.select("#rgn").append("svg")
	.attr("id", "network_svg")
	.attr("width", rgn_width)
	.attr("height", rgn_height);


// Emtpy rectangle for catching zoom events
// Note that styling in external CSS sheet does not work with SVG export.
// And for defining 
svg.append("rect")
	.attr("id", "zoom_rect")
	.attr("width", rgn_width)
	.attr("height", rgn_height)
	.style("fill", "none")
	.style("pointer-events", "all")
	// zoom and drag callback
	.call(d3.zoom()
		.scaleExtent([1 / 2, 4])
		.on("zoom", zoomed));

function zoomed() {
	svg_group.attr("transform", d3.event.transform);
}

// Content svg group
var svg_group = svg.append("g");

// Define arrowheads on directed edges
svg.append("svg:defs")
	.append("svg:marker")
		.attr("id", "subtle")  // 
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 30)
		.attr("refY", 0.0)
		.attr("markerWidth", 5)
		.attr("markerHeight", 5)
		.attr("orient", "auto")
	.append("svg:path")
		.attr("d", "M0,-5L10,0L0,5")
		.style("fill", "rgb(150,150,150)");

// Define color gradient used in legend
var gradient_ncolors = 10;
var gradient_colors = d3.range(gradient_ncolors)
	.map(function(val) {
		return d3.interpolateRdBu(1- val / gradient_ncolors); // reverse color scale
	});

svg.append("defs").append("linearGradient")
	.attr("id", "color-gradient-burd")
	// interpolateRdBu
	.attr("x1", "0%").attr("y1", "0%")
	.attr("x2", "100%").attr("y2", "0%")
	.selectAll("stop") 
	.data(gradient_colors)                  
	.enter().append("stop") 
	.attr("offset", function(d,i) { return i/(gradient_colors.length - 1); })   
	.attr("stop-color", function(d) { return d; });

// Variables storing current nodes and links
var node_data = {};  // dictionary of id->data
var nodes = [];
var links = [];

// Force layout simulation
var simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-40))
    .force("link", d3.forceLink(links).distance(30))
    .force("collide", d3.forceCollide().radius(15))
    .force("gravity", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(rgn_width / 2, rgn_height / 2))
    .on("tick", ticked);

// Declare D3 selections available to updateNetwork()
var link = svg_group.append("g")
	.style("stroke", "rgb(150,150,150)")
	.style("stroke-width", 1)
    .selectAll(".link");

// Network nodes containing circle with href span and a node label
var node = svg_group.append("g")
    	.selectAll(".node");

// update network based on nodes and links objects
function updateNetwork() {
	// Apply the general update pattern to the nodes.
	// Data is bound to the g object, containing circle, label, and link
	node = node.data(nodes, function(d) { return d.id;});
	node.exit().remove();  // deletes nodes no longer found in nodes object

	// Newly added nodes (from the data() binding)
	var node_new = node.enter().append("g")
		.attr("class", "node");

	// wrap entire node in link
	node_new = node_new.append("a")
		// link when clicking nodes
		.attr("xlink:href", function(d) {
			var elems = d.id.split("_");
			// ensembl ID as last element
			var ensembl = elems.pop().split(".")[0];
			return "/gene/" + ensembl;
		})
		.on("mouseover", function(d) {
			// console.log(d);
			d3.select(this).select("circle").attr("stroke-width", 2);
		})
		.on("mouseout", function(d) {
			// reset radius
			d3.select(this).select("circle").attr("stroke-width", 1);
		});

	// Construct new node: circle, url link and label
	var circle = node_new
		.append("circle")
			.attr("fill", function(d) {
				if (node_color_by === "Tissue") {
					return getTissueColor(d.id)
				} else {
					// get annotation value of current color scheme
					var val = annot[d.id][node_color_by];
					return nodeColorScale(val);
				}
			})
			.attr("stroke", "rgb(50,50,50)")
			.attr("stroke-width", 1)
			// larger key driver radius
			.attr("r", function(d) {
				if (d.key_driver) {
					return radius + 4;
				} else {
					return radius;
				}
			});

	var label = node_new.append("text")
		.attr("text-anchor", "middle")
		// Text off set
		.attr("dy", function(d) {
			if (d.key_driver) {
				return "-1.1em";
			} else {
				return "-0.7em";
			}
		})
		.style("font-size", "10px")
		.style("fill", "black")
		.text(function(d) {
			var elems = d.id.split("_");
			// remove first (tissue) and last element (ensembl)
			// allows correct labels of 'Y_RNA' gene symbols
			elems.shift()
			elems.pop()
			return elems.join("_");
		});

	// avoids adding already existing nodes
	node = node_new.merge(node);

	// Apply the general update pattern to the links.
	link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
	link.exit().remove();
	link = link.enter().append("line")
		.attr("marker-end", "url(#subtle)")  // set customly defined arrow head
		.attr("class", "link")
		.merge(link);

	// Update and restart the simulation.
	simulation.nodes(nodes);
	simulation.force("link").links(links);
	simulation.alpha(1).restart();
}

function ticked() {
	node.selectAll("circle")
		// Bounded by svg box
		// .attr("cx", function(d) { return Math.max(radius, Math.min(width - radius, d.x)); })
		// .attr("cy", function(d) { return Math.max(radius, Math.min(height - radius, d.y)); });
		.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });


	// label position, inherited by g .node
	node.selectAll("text")
		.attr("x", function(d) {return d.x; })
		.attr("y", function(d) {return d.y; });

	link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });
}

// Updates coloring scheme of network based on annotation features
function colorNodesBy(feature) {

	// set coloring scheme for newly added nodes
	// node_color_by = feature;
	setNodeColorScheme(feature);


	// change color for current nodes
	var circle = d3.selectAll("#rgn circle");
	if (feature === "Tissue") {
		// Set current 
		circle.style("fill", function(d) {
			return getTissueColor(d.id)
		});
	} else {
		circle.style("fill", function(d) {
			// Get numerical value of selected circle
			var val = annot[d.id][feature];
			return nodeColorScale(val);
		});
	}
}

// Update global variables specifying current node coloring scheme
function setNodeColorScheme(scheme) {
	// set global variable specifying the current node coloring scheme
	node_color_by = scheme;

	var min_range = 0.3;  // minimum +- range

	clearLegend();  // clear previous color legend

	if (scheme !== "Tissue") {
		// Update continuous color scale based on
		// Set up colorscale
		var values = _.map(annot, function(row) {
			return row[scheme];
		});

		var range = _.max(values, function(val) {
			// Comparator
			return Math.abs(val);
		});
		range = Math.abs(range);  // when absolute max is a negative number
		range = Math.max(range, min_range);

		// set global variable
		nodeColorScale = d3.scaleSequential(d3.interpolateRdBu)
			.domain([range, -range]);  // inverted, blue-red scale

		// Color gradient legend
		// Determine label
		switch(scheme) {
			case "DEG_log2FoldChange":
				var label = "log2 fold change";
				break;
			default:
				var label = "Pearson's cor.";
		}

		renderGradientLegend(range, "url(#color-gradient-burd)", label);
	}
}

// Get tissue color based on node id
function getTissueColor(id) {
	var elems = id.split("_");
	var tissue = elems[0];
	return colors[tissue_order.indexOf(tissue)];
}

function clearLegend() {
	d3.select("#legend").remove();
}

// Range is a positve value, indicating interval [-range, range]
function renderGradientLegend(range, gradient_def, label) {
	// Generate colors from sequence of numbers sequence
	var gradient_width = 200;
	var gradient_height = 10;
	var margin = 10;

	// set up color scale. Centered at x=0
	var xscaleColor = d3.scaleLinear()
		.domain([-range, range])
		.range([-gradient_width / 2, gradient_width / 2]);

	// Define x-axis
	var legendAxis = d3.axisBottom()
		.ticks(5)
		.scale(xscaleColor);

	// Position legend
	var legend = d3.select("#network_svg").append("g")
		.attr("id", "legend")
		.attr('transform', 'translate(' + (rgn_width - 100 - margin) + ',' + (margin) + ')');

	// Color interpolated gradient as rectangle
	legend.append("rect")
		.attr("x", -gradient_width/2)
		.attr("y", 0)
		.attr("width", gradient_width)
		.attr("height", gradient_height)
		.style("fill", gradient_def);

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

$(document).ready(function() {
	// Get genes found in module
	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		setModuleCount(data);
		renderModulePie(data);
		renderModuleTable(data);

		if (data.length > 3000) {
			$("#rgn").append(" Module is too large to infer Bayesian network.");
		}
	});

	// Get phenotype associations
	$.get('/api/pheno',
		{k: input.mod_id}
	).done(function(data) {
		renderPhenoAssoc(data);
	});

	// Get Bayesian network
	var edges_url = "/static/data/rgn/edges/" + input.mod_id + ".csv";
	$.get(edges_url)
		.done(function(data) {
			// Parse data
			data = $.csv.toObjects(data);

			storeNodeData(data);  // in node_data dict, key driver status

			var fdr_cutoff = calcFdrCutoff(data);

			renderSlider(data, fdr_cutoff);

			// Render network
			setNetwork(data, fdr_cutoff);
			updateNetwork();
		})
		.fail(function(err) {
			// Removes html objects in div, replaces with text
			// Warning: correct error messages written to #rgn relies on this AJAX call to execute first.
			$("#rgn").text("Data unavailable.");
		});

	// Get node annotation data
	var nodes_url = "/static/data/rgn/nodes/" + input.mod_id + ".csv";
	$.get(nodes_url)
		.done(function(data) {
			// Parse csv data
			data = $.csv.toObjects(data);

			// array to dictionary indexed by node id
			// for annotation lookup when changing color of nodes
			annot = data.reduce(function(map, row) {
				map[row.id] = row;
				return map;
			}, {});

			// Populate annotation options
			// loop over each header of data table
			$.each(Object.keys(data[0]), function(i, item) {
				if (item === "id") return;  // skip

				switch(item) {
					case "DEG_log2FoldChange":
						// Add to options with different name
						$("#annot_opts").append($("<option>", {
							value: item,
							text: "CAD DEG"
						}));
						break;
					default:
						// add to options as is
						$("#annot_opts").append($("<option>", {
							value: item,
							text: item
						}));
				}
			});

			// Callback function on setting node annotation
			d3.select("#annot_opts").on("change", function() {
				var selected_value = d3.select("#annot_opts").property("value");
				// console.log("Change: ", selected_value);

				colorNodesBy(selected_value);
			});
		});

	// Key driver analysis
	$.get('/api/kda',
		{k: input.mod_id}
	).done(function(data) {

		// console.log(data);

		if (data.length > 0) {
			renderTableKDA(data);
		} else {
			$("#kda").text("Data unavailable. No significant key drivers at FDR < 0.05.");
			$("#rgn").append(" No significant key drivers.");
		}
	}).fail(function(err) {
		console.log("error...")
	});

	// Endocrine candidates
	$.get('/api/endocrines',
		{from: input.mod_id}
	).done(function(data) {
		if (data.length == 0) {
			$("#endocrine_div").html("No candidates in co-expression module.");
		} else {
			renderEndocrineTable(data);
		}
	});

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

	// eQTL tables
	$.get('/api/eqtl',
		{module: input.mod_id}
	).done(function(data) {
		renderEqtlTable(data);
	})
	.fail(function(err) {
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
	// Uses tissue_order global variable, for plotting order

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
			colors: colors,
			// outline color
			line: {
				color: 'rgba(50, 50, 50, 1.0)',
				width: 1
		    },
		}
	}];

	Plotly.newPlot('tissue_pie', pie_data)
}

// Sets description of module size
function setModuleCount(data) {
	$("#mod_size").text(data.length);
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

function renderEqtlTable(eqtl) {
	var config = {
		column_order: ['clust', 'SNP', 'ensembl', 'hgnc_symbol', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		orderby: 'p-value',  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 5,
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(clust, type, row) {
				return "<a href='/module/" + clust + "'>" + clust + "</a>";
			},
			targets: 'clust'
		},
		{
			render: function(gene, type, row) {
				return "<a href='/gene/" + gene + "'>" + gene + "</a>";
			},
			targets: 'ensembl'
		},
		{
			render: function(snp, type, row) {
				return "<a href='/variant/" + snp + "'>" + snp + "</a>";
			},
			targets: 'SNP'
		}]
	};

	renderTable(eqtl, "#eqtl_table", config);
}

function renderEndocrineTable(eqtl) {
	var config = {
		column_order: ['hgnc_symbol', 'from_tissue', 'from_module', 'target_module', 'supernetwork', 'p', 'FDR'],
		orderby: 'p',  // sort by p-value column
		num_cols: ['p', 'FDR'],
		precision: 5,
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(clust, type, row) {
				return "<a href='/module/" + clust + "'>" + clust + "</a>";
			},
			targets: 'from_module'
		}, {
			render: function(clust, type, row) {
				return "<a href='/module/" + clust + "'>" + clust + "</a>";
			},
			targets: 'target_module'
		}, {
			render: function(gene, type, row) {
				return "<a href='/search?gene_snp_query=" + gene + "&type=Gene'>" + gene + "</a>";
			},
			targets: 'hgnc_symbol'
		}]
	};

	renderTable(eqtl, "#endocrine_table", config);
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

	var logp = data.map(function(d) {return d.logp});

	var plot_data = [{
	  type: 'scatter',
	  x: logp,
	  // data.map(function(d) {return d.logp}),
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
	  	title: 'CAD phenotype assoc. (-log10 p)',
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
	    tickcolor: 'rgb(102, 102, 102)',
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
	  width: 350,
	  height: 400,
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
	var epsilon = 0.5;  // low slider padding, log10 scale
	// log transformed FDR values
	var fdr_vals = data.map(function(d) { return -Math.log10(d.kda_FDR); })

	var slider = d3.sliderHorizontal()
		// .min(d3.min(fdr_vals))
		.min(Math.max(d3.min(fdr_vals) - epsilon, 0))
		.max(d3.max(fdr_vals))
		.width(300)
		.tickFormat(d3.format('.3s'))
		.ticks(5)
		.default(-Math.log10(fdr_cutoff))
		.on('onchange', _.debounce(
			// Debounce reduced jitter when dragging slider
			function(val) {
				setNetwork(data, Math.pow(10, -val));
				updateNetwork();
			}
		), 300);

	var g = d3.select("div#rgn_slider").append("svg")
		.attr("width", 350)
		.attr("height", 70)
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
	// console.log(edges);

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
	var node_ids = nodes.map(function(d) { return d.id });

	// Only add new nodes
	var add_nodes = _.difference(new_nodes, node_ids);

	// remove nodes previously in network that are not specified
	var del_nodes = _.difference(node_ids, new_nodes);

	// delete nodes globally
	del_nodes.map(function(id) {
		index = nodes.findIndex(function(d) {return d.id === id; })

		nodes.splice(index, 1);  // delete from array
	});

	// Convert to node format, such that new nodes can be added
	add_nodes = add_nodes.map(function(d) {
		// combine id object and node data
		return _.assign({id: d}, node_data[d]);
	});

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

// Stores key driver status in node_data
function storeNodeData(edges) {
	var nodes_from = edges.map(function(d) {return d.source; });
	var nodes_to = edges.map(function(d) {return d.target; });

	// Store data for each node key
	// var node_data = {};
	for (var i in nodes_to) {
		id = nodes_to[i];
		node_data[id] = {key_driver: false};
	}
	// overwrites key driver status
	for (var i in nodes_from) {
		id = nodes_from[i];
		node_data[id] = {key_driver: true};
	}
}


// Saves svg elements as .svg file
function saveSvg(svgEl, name) {
	svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	var svgData = svgEl.outerHTML;
	var preface = '<?xml version="1.0" standalone="no"?>\r\n';
	var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
	var svgUrl = URL.createObjectURL(svgBlob);
	var downloadLink = document.createElement("a");
	downloadLink.href = svgUrl;
	downloadLink.download = name;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
}


// Export html svg object as file.
// Works as a download link.
function exportNetworkSVG() {
	console.log("Exporting");
	var svg = d3.select("#network_svg").node();  // node() gets DOM object
	saveSvg(svg, "regulatory_gene_network.svg");
}

