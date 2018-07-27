from flask import (
	jsonify, request
)

from app.db import getDB, queryDB

from app.models import geneExprSerialize

from app import app


@app.route('/api/cpm', methods=['GET'])
def cpm():
	'''Gets all expression data of input gene'''
	# db = getDB()

	query = request.args['q']


	tissues = ["AOR", "MAM", "VAF", "SF", "Blood", "LIV", "FC", "MP"]

	expr = []  # list of results, one per tissue assumed
	for tis in tissues:
		# SQL query in tissue-specific gene expression table based on symbol
		sql = "select * from cpm_%s where hgnc_symbol = ?" %tis

		results = queryDB(sql, [query])
		print(results)

		if len(results) > 0:
			# parse SQL row to dictionary
			expr.append(geneExprSerialize(results[0]))

	return jsonify(expr)
