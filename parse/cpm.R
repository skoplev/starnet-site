# Parses STARNET case RNA-seq counts into cpm (counts per million) matrices

library(data.table)
library(edgeR)
library(biomaRt)

# Use for debug only
# rm(list=ls())
# setwd("~/Dev/STARNET/site")

emat_folder = "data/expr2"


# Load biomaRt data
ensembl = useMart("ensembl", dataset="hsapiens_gene_ensembl")

gene_map = getBM(
	attributes=c("ensembl_gene_id", "hgnc_symbol"),
	mart=ensembl)

dir.create(file.path(emat_folder, "cpm"))

mat_files = list.files(emat_folder, "*.mat$")
# print(mat_files)
out = lapply(mat_files, function(file_name) {
	message("parsing: ", file_name)
	# Read count matrix
	mat = fread(file.path(emat_folder, file_name))

	# Parse
	id = as.character(mat$id)
	mat = mat[, -1]
	mat = data.matrix(mat)

	# Additional transcript annotation
	tissue = sapply(strsplit(file_name, "[.]"), function(x) x[4])

	# Correct tissue encoding
	if (tissue == "BLO") {
		tissue = "BLOOD"
	} else if (tissue == "SKM") {
		tissue = "SKLM"
	} else if (tissue == "SUF") {
		tissue = "SF"
	} else if (tissue == "FOC") {
		tissue = "FC"
	} else if (tissue == "MAC") {
		tissue = "MP"
	}

	ensembl_versioned = sapply(strsplit(id, "_"), function(x) x[length(x)])
	ensembl_base = sapply(strsplit(ensembl_versioned, "[.]"), function(x) x[1])

	hgnc_symbol = gene_map$hgnc_symbol[match(ensembl_base, gene_map$ensembl_gene_id)]

	# Counts per million
	norm_mat = cpm(mat)

	# Collect attributes in data frame
	df = cbind(id, ensembl_base, hgnc_symbol, tissue, data.frame(norm_mat))

	write.csv(df, file.path(emat_folder, "cpm", file_name),
		row.names=FALSE)
})
