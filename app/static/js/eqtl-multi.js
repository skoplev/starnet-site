$(document).ready(function() {
	// netw = new SuperNetwork(data, "#super_network", 600, 600);

	$.getJSON("/static/data/eigen_network.json", function(data) {
		netw = new SuperNetwork(data, "#super_network", 600, 600);

		// Count number of eQTL genes per module
		var n_eqtl_genes = Object.keys(eqtl_by_module).map(function(key) {
			// return {clust: parseInt(key), n_eqtl_genes: eqtl_by_module[key].length};
			return {
				clust: parseInt(key),
				n_eqtl_genes: eqtl_by_module[key].length,
				eqtl_gene_frac: eqtl_by_module[key].length / data.mod_size[key - 1] * 100
			}
		});


		netw.addAnnotationData(n_eqtl_genes);  // for coloring
		// netw.colorCircles("n_eqtl_genes", function(x) { return x; }, "eQTL genes");
		// netw.colorCircles("n_eqtl_genes", Math.log10, "log10 eQTL genes");
		netw.colorCircles("eqtl_gene_frac", function(x) { return x; }, "eQTL gene %");

		// netw.colorCircles("n_eqtl_genes", function(x) { return x > 0; }, "eQTL genes");


		// Modification of supernetwork
		// Remove all hyperlinks on click, such that clicks can be used for filtering on page
		netw.svg.selectAll("a").attr("xlink:href", null)

		// netw.svg.selectAll("circle")
		// 	.on("mouseover", function(d) {

		// 	})
		// 	.on("mouseout", function(d) {

		// 	})

		d3.select("#zoom_rect").on("click", function() {
			// Research eQTL search filter
			var table = $("#eqtl_table").DataTable()
			table.search('')
				.columns().search('')
				.draw();  // reset

			// reset selection
			netw.svg.selectAll("circle")
				.style("stroke-width", 1);  // reset previous
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

				// Circle on select
				netw.svg.selectAll("circle")
					.style("stroke-width", 1);  // reset previous
				d3.select(this).style("stroke-width", 2.5);
			});

	});

	renderEqtlTable(eqtl);
});

function renderEqtlTable(eqtl) {
	var config = {
		column_order: ['clust', 'SNP', 'gene', 'hgnc_symbol', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		orderby: 'p-value',  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 5,
		dom: 'Blfrtip',
		buttons: ['copyHtml5', 'csvHtml5'],
		columnDefs: [{
			render: function(clust, type, row) {
				return "<a href='/module/" + clust + "'>" + clust + "</a>";
			},
			targets: 'clust'
		},
		{
			render: function(gene, type, row) {
				return "<a href='/gene/" + gene + "'>" + gene + "</a>";
			},
			targets: 'gene'
		},
		{
			render: function(snp, type, row) {
				return "<a href='/variant/" + snp + "'>" + snp + "</a>";
			},
			targets: 'SNP'
		}]
	};

	renderTable(eqtl, "#eqtl_table", config);
}
