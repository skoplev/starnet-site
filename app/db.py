import sqlite3

import os, glob, re
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
	"""
	Load cis-eQTL tables for all tissues including macrophages and foam cells.
	"""
	db = getDB()
	click.echo("Loading cis-eQTL...")

	eqtl_files = glob.glob('data/eQTL/STARNET.eQTLs.MatrixEQTL*')

	frames = []
	for file in eqtl_files:
		base_name = os.path.basename(file)

		# load eqtl table, as tab-separated file
		df = pd.read_csv(file, sep='\t')

		# split gene ids by ensembl base and version
		ensembl, ensembl_version = df['gene'].str.split('.').str

		# overwrite gene entry with ensembl id
		df['gene'] = ensembl

		# get tissue of file, write to column
		tissue = base_name.split('.')[3]
		df['tissue'] = tissue

		frames.append(df)

	combined_df = pd.concat(frames)

	# sort by p-value globally
	combined_df = combined_df.sort_values(by='p-value')

	print(combined_df)

	combined_df.to_sql('eqtl',
		db,
		index=False,
		if_exists='replace')


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

	# split versioned ensembl, overwrites 'ensembl'
	df['ensembl'], df['ensembl_version'] = df['ensembl'].str.split('.').str

	# write to SQL database
	df.to_sql('modules',
		db, 
		index=False,
		if_exists='replace')
	db.commit()

	# Specify primary key
	# Does not work with sqlite, wait with implementation until migrating to another database
	# db.execute('ALTER TABLE modules ADD PRIMARY KEY (ensembl)')
	# db.commit()

	closeDB()

def loadModuleGO():
	"""
	Load Gene Ontology (GO) enrichment tables for co-expression modules into sqlite3 datbase
	"""

	db = getDB()

	click.echo("Loading GO tables...")

	# Load GO enrichment tables by GO category
	frames = []
	for go_group in ['BP', 'CC', 'MF']:
		frames.append(
			pd.read_csv("data/modules/GO/mod_GO_" + go_group + ".tsv", sep="\t")
		)

	combined_df = pd.concat(frames)

	# Write to sql database
	combined_df.to_sql('go',
		db,
		index=False,
		if_exists='replace'
	)

	db.commit()
	closeDB()


def loadDEG():
	"""Load case-control differential expression tables into database."""

	db = getDB()
	click.echo("Loading differential expression statistics...")

	files = glob.glob("data/DEG/deseq/deseq_full*")

	# load dataframe for each tissue
	frames = []
	for f in files:
		# get tissue encoded in file name
		basename = os.path.basename(f)
		tissue = re.split('_|\.', basename)[2]


		# read file into pandas dataframe
		df = pd.read_csv(f)
		df.columns.values[0] = 'ensembl'
		df['tissue'] = tissue

		frames.append(df)  # store

	# Combine dataframes into single table
	combined_df = pd.concat(frames)

	# Write combined table to SQL database
	combined_df.to_sql('DEG',
		db,
		index=False,
		if_exists='replace')

	db.commit()
	closeDB()


def loadKDA():
	"""
	Load key driver analysis results.
	"""
	db = getDB()
	click.echo("Loading key driver analysis...")

	kda = pd.read_csv("data/kda/modules.results.txt", sep="\t")

	# Format node ID string
	tissue, gene, ensembl_versioned, extra = kda['NODE'].str.split('_').str

	# Fix 4 entries of gene: Metazoa_SRP
	# using Boolean array indexing
	idx = gene == "Metazoa"
	gene[idx] = "Metazoa_SRP"
	ensembl_versioned[idx] = extra[idx]

	kda['tissue'] = tissue
	kda['gene'] = gene

	# Format ensembl ID
	kda['ensembl'], ensembl_version = ensembl_versioned.str.split('.').str

	kda.to_sql("kda",
		db,
		index=False,
		if_exists='replace'
	)

	db.commit()
	closeDB()


def loadEnsembl():
	'''
	Loads Ensembl gene annotations from R biomaRt.
	'''

	db = getDB()
	click.echo("Loading Ensembl gene annotations...")

	df = pd.read_csv("data/ensembl/genes.csv")
	# print(df)

	df.to_sql("ensembl",
		db,
		index=False,
		if_exists='replace'
	)

	db.commit()
	closeDB()


def loadPhenoAssoc():
	db = getDB()
	click.echo("Loading phenotype associations...")

	df = pd.read_csv('data/modules/pheno/pheno_pval.csv')

	df.to_sql('pheno',
		db,
		index=False,
		if_exists='replace'
	)

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
    # loadeQTL()
    # loadModules()  # co-expression modules
    # loadModuleGO()  # gene ontology tables
    # loadDEG()  # differential expression
    loadPhenoAssoc()
    # loadKDA()
    # loadEnsembl()


# Registration with app
def initApp(app):
	app.teardown_appcontext(closeDB)
	app.cli.add_command(cmdInitDB)


def queryDB(query, args=(), one=False):
	'''
	Connect to SQL database and execute SQL query
	'''
	cur = getDB().execute(query, args)
	rv = cur.fetchall()
	cur.close()
	return (rv[0] if rv else None) if one else rv
