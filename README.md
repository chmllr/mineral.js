# README

Mineral.js is a yet another Lisp on JS started as an exercise after reading the "Roots of Lisp" paper by Paul Graham.

## Differences with Lisp

	- `true` is `t`
	- `false` is  `()`
	- `branch` is `cond`, but primitiver: `(branch guard then-action else-action)`
	- `head` is `car`
	- `tail` is `cdr`