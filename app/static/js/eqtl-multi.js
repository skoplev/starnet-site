$(document).ready(function() {
	// netw = new SuperNetwork(data, "#super_network", 600, 600);

	$.getJSON("/static/data/eigen_network.json", function(data) {
		netw = new SuperNetwork(data, "#super_network", 600, 600);

		// Count number of eQTL genes per module
		var n_eqtl_genes = Object.keys(eqtl_by_module).map(function(key) {
			return {clust: parseInt(key), n_eqtl_genes: eqtl_by_module[key].length};
		});

		netw.addAnnotationData(n_eqtl_genes);  // for coloring
		netw.colorCircles("n_eqtl_genes", function(x) { return x; }, "eQTL genes");

		// Modification of supernetwork
		// Remove all hyperlinks on click, such that clicks can be used for filtering on page
		netw.svg.selectAll("a").attr("xlink:href", null)

		d3.select("#zoom_rect").on("click", function() {
			// Research eQTL search filter
			var table = $("#eqtl_table").DataTable()
			table.search('')
				.columns().search('')
				.draw();  // reset
		});

		// click searches eQTL table
		netw.svg.selectAll("circle")
			.on("click", function(d) {
				// Fitler eQTL table for module
				var table = $("#eqtl_table").DataTable()
				table.search('')  // clear previous search
					.column(0)  // select column to search in
					.search("^" + d.module + "$", regex=true, smart=false)  // exact match
					.draw();  // render table
			});
	});

	renderEqtlTable(eqtl);
});

function renderEqtlTable(eqtl) {
	var config = {
		column_order: ['clust', 'SNP', 'gene', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		orderby: 'p-value',  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 5,
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(gene, type, row) {
				return "<a href='/module/" + gene + "'>" + gene + "</a>";
			},
			targets: 'clust'
		}]
	};

	renderTable(eqtl, "#eqtl_table", config);
}
