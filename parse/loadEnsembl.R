# Download ensembl annotation data for all genes
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
		'hgnc_symbol',
		'chromosome_name',
		'start_position',
		'end_position'
	),
	mart = ensembl
)

# Write gene table to .csv file
write.csv(gene_tab,
	"data/ensembl/genes.csv",
	row.names=FALSE)
