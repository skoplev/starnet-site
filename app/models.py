from app import db

def geneExprSerialize(sql_row, num_col=5):
	"""
	Parses CPM gene expression matrix for single gene
	"""
	return {
		'id': sql_row['id'],
		'hgnc_symbol': sql_row['hgnc_symbol'],
		'tissue': sql_row['tissue'],
		'cpm': sql_row[num_col:len(sql_row.keys())]
	}
