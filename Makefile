update:
	git show master:README.md > README.md
	git show master:Mineral.js > javascripts/Mineral.js
	git show master:mrl/core.mrl > mrl/core.mrl
	git show master:mrl/mineral-console.mrl > mrl/mineral-console.mrl
	git ca -m "updates"
	git push
