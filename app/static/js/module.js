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
			// data = $.csv.toArrays(data);
			data = $.csv.toObjects(data);
			// console.log(data);
			renderRGN(data);
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

function renderRGN(edges) {
	var height = 600;
	var width = 960;
	var radius = 5;

	// Filter edges based on number of edges that can be shown
	var max_edges = 300;
	if (edges.length > max_edges) {
		// Assumes that edges data is ordered by kda_FDR
		var fdr_cutoff = edges[max_edges - 1].kda_FDR

		// Filter edges
		edges_filter = edges.filter(function(elem) {
			return Number(elem.kda_FDR) < Number(fdr_cutoff);
		});
	} else {
		// use all
		edges_filter = edges;
	}

	var nodes_from = edges_filter.map(function(d) {return d.source; });
	var nodes_to = edges_filter.map(function(d) {return d.target; });

	var nodes = _.unique(nodes_from.concat(nodes_to));

	nodes = nodes.map(function(d) { return {id: d }; })

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

	var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(edges_filter)
		.enter().append("line")
			.attr("stroke-width", 2);

	var node = svg.append("g")
		.attr("class", "nodes")
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