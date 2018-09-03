// Enable bootstrap tooltips
$(function () {
	$('[data-toggle="tooltip"]').tooltip({trigger: "click"});
})


var gene_symbols = [];  // for autocomplete

$(document).ready(function() {

	// Load supernetwork data, for visualization
	$.getJSON('/static/data/eigen_network.json', function(data) {

		var netw = new SuperNetwork(data, "#super_network");

		// Select dropdown callback function
		d3.select("#annot_opts").on("change", function() {
			var selected_value = d3.select("#annot_opts").property("value")
			netw.colorCircles(selected_value, neglog10);
		});

		// Populate options based on all annotations
		$.each(Object.keys(data.annot[0]), function(i, item) {

			if (item !== "clust") {

				$("#annot_opts").append($("<option>", {
					value: item,
					text: item
				}));

				// Introduce separators in option selector by order
				if (item === "Secreted proteins") {
					// insert separator
					$("#annot_opts").append("<option disabled>─────Phenotypes─────</option>");
				}

				if (item === "fP-TG") {
					// last phenotype feature
					$("#annot_opts").append("<option disabled>──────GWAS──────</option>");
				}
			}
		});

		// Set default option
		$("#annot_opts").val("Tissue");

		// invoke change event to set color
		var event = new Event('change');
		document.getElementById("annot_opts").dispatchEvent(event);
	});

	// Load autocomplete genes
	$.getJSON("/static/data/gene_symbols.json", function(data) {
		gene_symbols = data;

		setQueryType($("#search_select")[0]);  // pass DOM object
	});
});

// Updates search query autosuggest and placeholder text
function setQueryType(obj) {
	switch(obj.value) {
		case "Gene":
			$("#search_input")
				.autocomplete({
					// specify array of symbols to show with max number of entries
					// source can also be set as a symbol array
					source: function(request, response) {
						var results = $.ui.autocomplete.filter(gene_symbols, request.term);

						// max number or results to show
						response(results.slice(0, 20));
					},
					minLength: 2
				})
				.attr("placeholder", "Search for genes...");
			break;
		case "SNP":
			// No autosuggest
			$("#search_input")
				.autocomplete({
					source: []
				})
				.attr("placeholder", "Search for SNPs...");
			break;
		default:
			throw "Invalid option type.";
	}
}
