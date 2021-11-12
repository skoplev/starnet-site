# Calculate matrix of gene-level annotations
# Used when visualizing the regulatory gene networks

rm(list=ls())

library(data.table)
library(WGCNA)  # corAndPvalue()
source("~/GoogleDrive/projects/STARNET/cross-tissue/src/parse.R")

setwd("~/Dev/STARNET-site")
source("parse/lib/parse.R")

# Load gene expression matrix
load("~/DataProjects/cross-tissue/STARNET/gene_exp_norm_reshape/expr_recast.RData", verbose=TRUE)

# Parse expression data
expr = parseExprTable(expr_recast)
rm(expr_recast)  # lower memory usage

# Load phenotype data
pheno = fread(
	"~/GoogleDrive/projects/STARNET/phenotype/data/current/STARNET_main_phenotype_table.2017_12_03.tsv"
)

# Match phenotype data
pheno_match = pheno[match(colnames(expr$mat), pheno$starnet.ID), ]


# Load differential expression data
# ----------------------------------
deg_tissues = c("AOR", "SKLM", "LIV", "VAF", "SF")

deg = lapply(deg_tissues, function(tissue) {
	d = fread(paste0("~/GoogleDrive/projects/STARNET/cross-tissue/case-control/data/deseq/deseq_full_", tissue, ".csv"))
	d$tissue = tissue
	return(d)
})
names(deg) = deg_tissues

# Use AOR statistics for MAM tissue
# deg$MAM = deg$AOR
# deg$MAM$tissue = "MAM"

# Combine
deg_all = rbindlist(deg)
colnames(deg_all)[1] = "ensembl"

deg_all$tissue_ensembl = paste(deg_all$tissue, deg_all$ensembl, sep="_")


# Load gender differential expression data
# ----------------------

gender_deg = readRDS("~/GoogleDrive/projects/STARNET/cross-tissue/gender/tables/gender_deseq_tables_by_tissue.rds")

# Annotate each table with tissue-ensembl IDs for matching
for (tissue in names(gender_deg)) {

	ensembl = sapply(strsplit(rownames(gender_deg[[tissue]]), "_"), function(x) x[length(x)])

	# strip version
	ensembl = sapply(strsplit(ensembl, "[.]"), function(x) x[1])

	gender_deg[[tissue]]$tissue_ensembl = paste(tissue, ensembl, sep="_")
}

gender_deg = lapply(gender_deg, as.data.frame)
gender_deg_all = rbindlist(gender_deg)


# For matching DEG gene IDs to expression data
expr$meta_row$tissue_ensembl = paste(expr$meta_row$tissue, expr$meta_row$ensembl_base, sep="_")

# Calculate correlations
# Phenotypes to include
features = c(
	"syntax_score",
	"DUKE",
	"ndv",
	"lesions",
	"BMI(kg/m2)",
	"CRP(mg/l)",
	"HbA1c(%)",
	"Waist/Hip",
	"P-Chol(mmol/l)",
	"fP-LDL-Chol(mmol/l)",
	"fP-HDL-Chol(mmol/l)",
	"fP-TG(mmol/l)"
)

# Calculate per-gene correlation statistics for each feature
fits = list()
for (feature in features) {
	message(feature)
	fits[[feature]] = corAndPvalue(t(expr$mat), pheno_match[[feature]])
}

annot = sapply(fits, function(fit) {
	# return(fit$p)
	return(fit$cor)
})
# rownames(annot) = rownames(expr$mat)
rownames(annot) = expr$meta_row$tissue_ensembl

annot = data.frame(annot, check.names=FALSE)

# Prepend differential expression statistics
DEG_annot = data.frame(
	CAD_DEG_log2FoldChange=deg_all$log2FoldChange[
		match(expr$meta_row$tissue_ensembl, deg_all$tissue_ensembl)
	],
	gender_DEG_log2FoldCHange=gender_deg_all$log2FoldChange[
		match(expr$meta_row$tissue_ensembl, gender_deg_all$tissue_ensembl)
	]
)

# Prepend
annot = cbind(DEG_annot, annot)

annot = renameAnnot(annot)

write.csv(annot, "data/geneAnnot/annot.csv")
