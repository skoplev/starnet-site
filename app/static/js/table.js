// Library for rendering and getting tabular data
// Uses DataTables

function renderTable(data, container, config) {
	// wrapper function for calling DataTable initialization
	// container: JQuery selector for html table object
	// config.num_cols: array of numerical columns to be rounded
	// config.precision: rounding precision
	// config.column_order: array of column ids

	// get columns order as recieved from flask api
	var columns = Object.keys(data[0]);

	// set default empty config values
	if (config['num_cols'] === undefined) {
		config.num_cols = [];
	}

	if (config['buttons'] === undefined) {
		config.buttons = [];
	}

	if (config['columnDefs'] === undefined) {
		config.columnDefs = [];
	}

	// get column index (original) of numeric columns
	var num_col_index = config.num_cols.map(function(col) {
		return columns.indexOf(col);
	})

	// Format data for DataTable
	var tab = jsonFormatTable(data);

	// Init DataTable
	var table = $(container).DataTable({
		data: tab.data,
		columns: tab.columns,
		order: config.order,
		dom: config.dom,
		buttons: config.buttons,
		colReorder: true,  // enabling column reorder plugin
		// rounding transformation
		columnDefs: [{
			render: function(num, type, row) {
				return num.toPrecision(config.precision);
			},
			targets: num_col_index
		}].concat(config.columnDefs)  // add custom column definitions
	});

	// Reorder columns based on column_order
	var order = config.column_order.map(function(col) {
		return columns.indexOf(col)
	});

	table.colReorder.order(order);
}

function jsonFormatTable(json) {
	// formats json object from python pandas dataframe
	// for use with DataTable

	var tab_data = {};

	// Assumes that all 'columns' are identical
	var col_names = Object.keys(json[0]);

	// [title: name, ...]
	tab_data.columns = col_names.map(function(col) {
		return {title: col}
	});

	// [row1, row2] of values
	tab_data.data = json.map(function(row) {
		return Object.values(row);
	});

	return tab_data;
}
