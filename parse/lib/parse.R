# Shared functions for parsing data

# Rename annotation table
renameAnnot = function(annot) {
	annot = rename(annot, c(
		"case_control_DEG"="CAD DEG",
		"syntax_score"="SYNTAX",
		"ndv"="Diseased vessels",
		"BMI(kg/m2)"="BMI",
		"CRP(mg/l)"="CRP",
		"HbA1c(%)"="HbA1c",
		"P-Chol(mmol/l)"="P-Chol",
		"fP-LDL-Chol(mmol/l)"="fP-LDL-Chol",
		"fP-HDL-Chol(mmol/l)"="fP-HDL-Chol",
		"fP-TG(mmol/l)"="fP-TG"
	))

	return(annot)
}


