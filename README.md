# STARNET gene expression browser
Web site for visualizing and searching STARNET RNA-seq data.

# Setup data symbolic links (or copy to data/expr folder)
ln -s ~/DataProjects/STARNET/oscar_mat/ data/expr

# parse gene expression data into CPM matrices
Rscript parse/cpm.R