console.log("enrichment.js");


$(document).ready(function() {
	renderEnrichmentTable(enrich);
});

function renderEnrichmentTable(enrich) {
	var config = {
		column_order: [
			'module',
			'module_size',
			'overlap',
			'p',
			'FDR',
			"genes"
		],
		num_cols: [
			'p',
			'FDR'
		],
		precision: 5,
		orderby: 'FDR',
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(gene, type, row) {
				return "<a href='/module/" + gene + "'>" + gene + "</a>";
			},
			targets: 'module'
		}]
	};

	renderTable(enrich, "#enrich_table", config);
}