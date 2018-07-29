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
	});
});

function renderTable(data, container, config) {
	// wrapper function for calling DataTable initialization
	// container: JQuery selector for html table object
	// config.num_cols: array of numerical columns to be rounded
	// config.precision: rounding precision
	// config.column_order: array of column ids

	// get columns order as recieved from flask api
	var columns = Object.keys(data[0]);

	// set default empty config values
	if (config['num_cols'] === undefined) {
		config.num_cols = [];
	}

	// get column index (original) of numeric columns
	var num_col_index = config.num_cols.map(function(col) {
		return columns.indexOf(col);
	})

	// Format data for DataTable
	var tab = jsonFormatTable(data);

	// Init DataTable
	var table = $(container).DataTable({
		data: tab.data,
		columns: tab.columns,
		order: config.order,
		colReorder: true,  // enabling column reorder plugin
		// rounding transformation
		columnDefs: [{
			render: function(num, type, row) {
				return num.toPrecision(config.precision);
			},
			targets: num_col_index
		}]
	});

	// Reorder columns based on column_order
	var order = config.column_order.map(function(col) {
		return columns.indexOf(col)
	});

	table.colReorder.order(order);
}

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
		precision: 4  // precision of rounding
	};

	renderTable(data, '#deg_table', config);
}

function renderTableQTL(data) {
	// Sets up eQTL table call for DataTable render
	var columns = Object.keys(data[0]);

	var config = {
		column_order: ['SNP', 'gene', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		order: [[columns.indexOf('p-value'), 'asc']],  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 4
	};

	renderTable(data, '#eqtl_table', config);
}

function jsonFormatTable(json) {
	// formats json object from python pandas dataframe
	// for use with DataTable

	var tab_data = {};

	// Assumes that all 'columns' are identical
	var col_names = Object.keys(json[0]);

	// [title: name, ...]
	tab_data.columns = col_names.map(function(col) {
		return {title: col}
	});

	// [row1, row2] of values
	tab_data.data = json.map(function(row) {
		return Object.values(row);
	});

	return tab_data;
}

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
