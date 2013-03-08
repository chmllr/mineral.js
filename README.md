# README

Mineral.js is a yet another Lisp on JS started as an exercise after reading "The Roots of Lisp" paper by Paul Graham.

## Syntactic Sugar

 - quote `*`, unquote `~`, backquote `\``
 - lambda function `(% arg1 arg2 ... argN . s-expression)`

## Differences with Lisp

 - `t` is `true`
 - `()` is `false`
 - `cond` is `if` with intuitive semantics: `(if guard then-action  else-action)`
 - `car` is `head`
 - `cdr` is `tail`
 - `label` is `def`
