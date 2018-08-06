$(document).ready(function() {
	// Load supernetwork data, for visualization
	$.getJSON('/static/data/eigen_network.json', function(data) {
		superNetwork(data, "#super_network");

		// Populate options based on all annotations
		$.each(Object.keys(data.annot[0]), function(i, item) {
			if (item !== "clust") {
				$("#annot_opts").append($("<option>", {
					value: item,
					text: item
				}));

				if (item === "Tissue") {
					// insert separator
					$("#annot_opts").append("<option disabled>──────────</option>");
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
