$(document).ready(function() {
	// Ajax get request for CPM data
	$.get('/api/cpm', 
		{q: input.gene}
	).done(function(data) {
		cpmBoxplot(data);
	});

	// Load co-expression modules of input gene
	$.get('/api/in-module',
		{q: input.gene}
	).done(function(data) {
		addModuleLinks(data);
		moduleBarplot(data);
	});
});

function test() {
	console.log("test invoked");
};

function cpmBoxplot(data) {
	// rename (duplicate) data for rendering with plotly
	// modifies data array objects
	data.map(function(d) {
		d.y = d.cpm;
		d.type = 'box';
		d.name = d.tissue;  // name of each box plot
		return d;
	});

	// Plotly layout config
	var layout = {
		yaxis: {
			title: 'CPM',
			showline: true
		},
		xaxis: {
			title: 'Tissue/cell type'
		}
	};

	Plotly.plot('cpm_boxplot', data, layout);
};

function addModuleLinks(data) {
	var div = $('#module_links');

	div.append("Module IDs (tissue of ", input.gene, "): ");

	// Write comma separated list of links to div
	data.map(function(d, i) {
		// comma except for first entry
		if (i > 0) {
			div.append(", ");
		}

		// Make hyperlink to module
		var a = document.createElement('a');
		$(a).html(d.module + " (" + d.gene_tissue + ")")
			.attr('href', '/module/' + d.module)
			.appendTo(div);

	});
};

function moduleBarplot(data) {
	// Plots module transcript statistics as stacked barplot

	// Reshape data from Ajax get to comply with Plotly barplot format
	var tissues = ['AOR', 'MAM', 'VAF', 'SF',  'BLOOD', 'LIV', 'SKLM',]

	// Get module ids
	// Prepended with 'mod' to avoid number interpretation by Plotly
	// var module_ids = data.map(function(d) {return 'mod'.concat(d.module.toString())});
	var module_ids = data.map(function(d) {return 'mod' + d.module.toString() + " (" + d.gene_tissue + ")"});

	// Tissue-by-tissue array containing data
	plt_data = tissues.map(function(t) {
		d = {};
		d.x = module_ids;
		d.y = data.map(function(d) {return d.tissue_counts[t]});
		d.name = t;

		d.type = 'bar';
		return(d)
	});

	// Stacked Plotly layout config
	var layout = {
		barmode: 'stack',
		xaxis: {
			title: 'Co-expression modules containing ' + input.gene 
		},
		yaxis: {
			title: 'Transcripts',
			showline: true
		}
	};

	Plotly.plot('module_barplot', plt_data, layout);
};
