// Gene set enrichment analysis results page

$(document).ready(function() {
	// Load supernetwork
	$.getJSON("/static/data/eigen_network.json", function(data) {
		netw = new SuperNetwork(data, "#super_network", 600, 600);

		// Transform data
		enrich_transform = enrich.map(function(d) {
			return {clust: d.module, enrichment_FDR: d.FDR};
		});

		netw.addAnnotationData(enrich_transform);  // for coloring
		netw.colorCircles("enrichment_FDR", neglog10);

	});

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
