// Enable bootstrap tooltips
$(function () {
	$('[data-toggle="tooltip"]').tooltip({trigger: "click"});
})

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
});
