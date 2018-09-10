// Enable bootstrap tooltips
$(function () {
	$('[data-toggle="tooltip"]').tooltip({trigger: "click"});
})

// Reshape data from Ajax get to comply with Plotly barplot format
var tissues = ['AOR', 'MAM', 'VAF', 'SF',  'BLOOD', 'LIV', 'SKLM',]

// Reorder colorbrewer colors
var colors = [0, 4, 3, 7, 1, 6, 2].map(function(i) {
	return d3.schemeSet1[i];
});

$(document).ready(function() {

	// multiple AJAX calls and dependencies
	$.when(
		// Load supernetwork
		$.getJSON("/static/data/eigen_network.json", function(data) {
			// netw = new SuperNetwork(data, "#super_network");
		}),

		// Load co-expression modules of input gene
		$.get('/api/in-module',
			{q: input.gene}
		).done(function(data) {
			addModuleLinks(data);
			moduleBarplot(data);
		})
	).then(function(netw_data, tissue_search_data) {
		netw = new SuperNetwork(netw_data[0], "#super_network", 500, 500);

		// Color supernetwork by
		netw.colorCirclesTissueSearch(tissue_search_data[0])
	});

	// Ajax get request for CPM data
	$.get('/api/cpm', 
		{q: input.gene}
	).done(function(data) {
		cpmBoxplot(data);
	});

	// Differential expression statistics
	$.get('/api/deg',
		{q: input.gene}
	).done(function(data) {
		renderTableDEG(data);
	});

	// eQTL tables
	$.get('/api/eqtl',
		{gene: input.gene}
	).done(function(data) {
		renderTableQTL(data);
	})
	.fail(function(err) {
	});
});


function renderTableDEG(data) {
	// Sets up custom configuration of DataTable call for DEG table data

	// Table configuration
	var config = {
		column_order: [
			'tissue',
			'ensembl',
			'hgnc_symbol',
			'baseMean',
			'log2FoldChange',
			'pvalue',
			'padj'
		],
		// declaration of numerical column names to be rounded
		num_cols: [
			'baseMean',
			'log2FoldChange',
			'pvalue',
			'padj'
		],
		precision: 5,  // precision of rounding
		dom: 'Bfrti',
		buttons: ['copyHtml5', 'csvHtml5']
	};

	renderTable(data, '#deg_table', config);
}

function renderTableQTL(data) {
	// Sets up eQTL table call for DataTable render
	var columns = Object.keys(data[0]);

	var config = {
		column_order: ['SNP', 'ensembl', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		orderby: 'p-value',  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 5,
		dom: 'Blfrtip',  // interface elements to show, and order
		buttons: [
            'copyHtml5',
            'csvHtml5'
        ],
        // Custom column definition to be appended to shared defs
        columnDefs: [{
			render: function(snp, type, row) {
				// url link to snp
				return "<a href='/variant/" + snp + "'>" + snp + "</a>";
			},
			targets: "SNP"
		}]
	};

	renderTable(data, '#eqtl_table', config);
}

function cpmBoxplot(data) {
	// rename (duplicate) data for rendering with plotly
	// modifies data array objects
	data.map(function(d) {
		d.y = d.cpm;
		d.type = 'box';
		d.name = d.tissue;  // name of each box plot

		d.marker = {};
		d.marker.color = colors[tissues.indexOf(d.tissue)];

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
}

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

		d.marker = {};
		d.marker.color = colors[tissues.indexOf(t)];

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
		},
		width: 500
	};

	Plotly.plot('module_barplot', plt_data, layout);
};
