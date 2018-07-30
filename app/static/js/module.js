$(document).ready(function() {

	$.get('/api/module',
		{k: input.mod_id}
	).done(function(data) {
		renderModuleTable(data);
	});
});

function renderModuleTable(data) {

	var config = {
		column_order: [
			'tissue',
			'ensembl',
			'gene_symbol',
			'clust'
		],
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5']
	};

	renderTable(data, '#mod_table', config);
}