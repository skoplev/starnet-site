# Download ensembl annotation data for all genes
rm(list=ls())
# setwd("~/Dev/STARNET-site")

library(biomaRt)

# Establish database connection
ensembl = useEnsembl(biomart="ensembl", dataset="hsapiens_gene_ensembl")

# listDatasets(ensembl)
# listAttributes(ensembl)

# Get table
gene_tab = getBM(attributes=c(
		'ensembl_gene_id',
		'description',
		'gene_biotype',
		'transcript_biotype',
		'hgnc_symbol',
		'chromosome_name',
		'start_position',
		'end_position',
		'strand',
		'uniprot_gn'
	),
	mart = ensembl
)

# Write gene table to .csv file
write.csv(gene_tab,
	"data/ensembl/genes.csv",
	row.names=FALSE)
