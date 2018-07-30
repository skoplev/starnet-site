$(document).ready(function() {

	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		renderModulePie(data);
		renderModuleTable(data);
	});
});

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
		sort: false  // dont reorder and recolor tissues
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