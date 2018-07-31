$(document).ready(function() {
	// Load supernetwork data, for visualization
	$.getJSON('/static/data/eigen_network.json', function(data) {
		// console.log(data);
		// $("#super_network").text(JSON.stringify(data));

		superNetwork(data, "#super_network");
	});
});