$(document).ready(function() {

	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		renderModulePie(data);
		renderModuleTable(data);
	});
});

function renderModulePie(data) {
	// Count transcripts from certain tissues
	var tissue = data.map(function(row) {
		return row['tissue']
	})

	// count using underscore.js
	var tissue_counts = _.countBy(tissue);

	pie_data = [{
		values: Object.values(tissue_counts),
		labels: Object.keys(tissue_counts),
		type: 'pie'
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
			targets: gene_col_index
		}]
	};

	renderTable(data, '#mod_table', config);
}