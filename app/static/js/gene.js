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

	$.get('/api/deg',
		{q: input.gene}
	).done(function(data) {
		renderTableDEG(data);
	});
});

function renderTableDEG(data) {
	// get columns order as recieved from flask api
	var columns = Object.keys(data[0]);

	// specify desired column order
	var column_order = [
		'tissue',
		'ensembl',
		'hgnc_symbol',
		'baseMean',
		'log2FoldChange',
		'pvalue',
		'padj'];

	// specify numeric columns for rounding
	var num_cols = ['baseMean', 'log2FoldChange', 'pvalue', 'padj'];
	var precision = 4;

	// get column index (original) of numeric columns
	var num_col_index = num_cols.map(function(col) {
		return columns.indexOf(col);
	})

	// Format data for DataTable
	var tab = jsonFormatTable(data);

	// Init DataTable
	var table = $('#deg_table').DataTable({
		data: tab.data,
		columns: tab.columns,
		colReorder: true,  // enabling column reorder plugin
		// rounding transformation
		columnDefs: [{
			render: function(num, type, row) {
				return num.toPrecision(precision);
			},
			targets: num_col_index
		}]
	});

	// Reorder columns based on column_order
	var order = column_order.map(function(col) {
		return columns.indexOf(col)
	});

	table.colReorder.order(order);
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
};

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
