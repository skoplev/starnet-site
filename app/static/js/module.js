$(document).ready(function() {
	// Get genes found in module
	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		renderModulePie(data);
		renderModuleTable(data);
	});

	$.get('/api/pheno',
		{k: input.mod_id}
	).done(function(data) {
		renderPhenoAssoc(data);
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

	var columns

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