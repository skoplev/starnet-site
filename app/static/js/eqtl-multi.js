console.log("eqtl js");

$(document).ready(function() {
	renderEqtlTable(eqtl);
});

function renderEqtlTable(eqtl) {
	var config = {
		column_order: ['SNP', 'gene', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value', 'clust'],
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
