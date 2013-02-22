# README

Mineral.js is yet another Lisp on JS started as an exercise after reading the "Roots of Lisp" paper by Paul Graham.

## Differences to Lisp

	- `true` is `t`
	- `false` is  `()`
	- `branch` is `cond`, but primitiver: `(branch guard then-action else-action)`
	- `head` is `car`
	- `tail` is `cdr`