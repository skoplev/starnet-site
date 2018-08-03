$(document).ready(function() {
	// Load supernetwork data, for visualization
	$.getJSON('/static/data/eigen_network.json', function(data) {
		superNetwork(data, "#super_network");

		// Populate options based on all annotations
		$.each(Object.keys(data.annot[0]), function(i, item) {
			$("#annot_opts").append($("<option>", {
				value: item,
				text: item
			}));
		});

		// Set default option
		$("#annot_opts").val("case_control_DEG");

		// invoke change event
		var event = new Event('change');
		document.getElementById("annot_opts").dispatchEvent(event);


		// d3.select("#annot_opts").property("value", "case_control_DEG");

	});
});
