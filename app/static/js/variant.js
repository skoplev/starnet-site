
$(document).ready(function() {
	// Load eQTL data for SNP
	$.get('/api/eqtl',
		{snp: input.snp}
	).done(function(data) {
		// console.log(data);
		renderTableQTL(data);
	});
});


function renderTableQTL(data) {
	// Sets up eQTL table call for DataTable render
	var columns = Object.keys(data[0]);

	// ensembl column index for generating urls
	var gene_col_index = columns.indexOf('ensembl');
	if (gene_col_index === -1) {
		gene_col_index = [];
	}

	var config = {
		column_order: ['SNP', 'ensembl', 'tissue', 'beta', 't-stat', 'p-value', 'adj.p-value'],
		order: [[columns.indexOf('p-value'), 'asc']],  // sort by p-value column
		num_cols: ['beta', 't-stat', 'p-value', 'adj.p-value'],
		precision: 5,
		dom: 'Blfrtip',  // interface elements to show, and order
		buttons: [
            'copyHtml5',
            'csvHtml5'
        ],
        // Custom column definition to be appended to shared defs
        columnDefs: [{
			render: function(gene, type, row) {
				// url link to gene
				return "<a href='/gene/" + gene + "'>" + gene + "</a>";
			},
			targets: gene_col_index
		}]
	};

	renderTable(data, '#eqtl_table', config);
}
