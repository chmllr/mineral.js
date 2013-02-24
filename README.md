# README

Mineral.js is a yet another Lisp on JS started as an exercise after reading the "Roots of Lisp" paper by Paul Graham.

## Differences with Lisp

 - `t` is `true`
 - `()` is `false`
 - `cond` is `branch`, but `branch` primitiver: `(branch guard then-action  else-action)`
 - `car` is `head`
 - `cdr` is `tail`
 - `label` is `def`