import sqlite3

import os
import pandas as pd

import click

from flask import current_app, g
from flask.cli import with_appcontext

def getDB():
	"""
	Opens sqlite3 database connection, returning database handle
	"""
	if 'db' not in g:
		g.db = sqlite3.connect(
		    current_app.config['DATABASE'],
		    detect_types=sqlite3.PARSE_DECLTYPES
		)
		g.db.row_factory = sqlite3.Row

	return g.db


def closeDB(e=None):
	db = g.pop('db', None)

	if db is not None:
		db.close()


def initDB():
	db = getDB()

	# Load schema
	with current_app.open_resource('schema.sql') as f:
	    db.executescript(f.read().decode('utf8'))


def loadCPM(cpm_dir="data/expr/cpm"):
	"""Load gene expression data into SQL database."""

	# get database handle
	db = getDB()
	click.echo("Loading CPM matrices...")
	
	# Assume that all files in directory are CPM files
	cpm_files = os.listdir(cpm_dir)

	for file in cpm_files:
		tissue = file.split(".")[1]
		print("Adding ", file)
		
		# Read as panda dataframe
		df = pd.read_csv(os.path.join(cpm_dir, file))

		# Add as SQL table to database
		df.to_sql("cpm_" + tissue,
			db,
			index=False,  # dont write row index
			index_label="id",  # SQL index column
			if_exists="replace")

		# Write to database
		db.commit()

	closeDB()

def loadeQTL():
	# TODO
	pass

def loadModules():
	"""
	Load STARNET co-expression modules into database.
	Table describes the assigned module IDs for included transcripts
	"""
	db = getDB()
	click.echo("Loading co-expression modules...")

	# Load module co-expression table into panda
	df = pd.read_csv("data/modules/modules.csv")

	# Remove version from ensembl IDs
	df['ensembl_versioned'] = df['ensembl']

	# print(df['ensembl'].str.split('.'))
	df['ensembl'], df['ensembl_version'] = df['ensembl'].str.split('.').str

	# write to SQL database
	df.to_sql("modules",
		db, 
		index=False,
		if_exists="replace")

	db.commit()
	closeDB()


# flask init-db command
@click.command('init-db')
@with_appcontext
def cmdInitDB():
    """Clear the existing data and create new tables."""
    initDB()
    click.echo('Initialized the database.')

    # Load tables to database
    # Comment out during development to avoid reloading
    # loadCPM()
    loadeQTL()
    loadModules()



# Registration with app
def initApp(app):
	app.teardown_appcontext(closeDB)
	app.cli.add_command(cmdInitDB)


def queryDB(query, args=(), one=False):
    cur = getDB().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv
