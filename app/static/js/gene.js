$(document).ready(function() {
	// console.log("Page loaded");

	// Ajax get request for CPM data
	$.get("/api/cpm", 
		{q: input.gene}
	).done(function(data) {
		cpmBoxplot(data);
	});

});

function test() {
	console.log("test invoked");
};

function cpmBoxplot(data) {
	// rename (duplicate) data for rendering with plotly
	// modifies data array objects
	data.map(function(x) {
		x.y = x.cpm;
		x.type = 'box';
		x.name = x.tissue;  // name of each box plot
		return x;
	});

	// Plotly layout config
	var layout = {
		yaxis: {
			title: 'CPM',
			showline: true
		},
		xaxis: {
			title: 'Tissue/cell type'
		}
	};

	Plotly.plot('cpm_boxplot', data, layout);
};