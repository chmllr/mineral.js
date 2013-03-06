function assertEqual (n, input, output) {
	if(output == interpret(input))
		console.log("Test " + n + " successful: interpretation of '"
					+ input + "' produces '" + output + "'");
	else console.error("Test failed: interpretation of '"
						+ input + "' doesn't produce '" + output + "'");
}



function runTests() {

	assertEqual(1, "'a", "a");
	assertEqual(2, "'(a b c)", "(a b c)");
	assertEqual(3, "(atom 'a)", true);
	assertEqual(4, "(atom '(a b c))", false);
	assertEqual(5, "(atom '())", true);
	assertEqual(6, "(atom (atom 'a))", true);
	assertEqual(7, "(atom '(atom 'a))", false);
	assertEqual(8, "(eq 'a 'a)", true);
	assertEqual(9, "(eq 'a 'b)", false);
	assertEqual(10, "(eq '() '())", true);
	assertEqual(11, "(head '(a b c))", "a");
	assertEqual(12, "(tail '(a b c))", "(b c)");
	assertEqual(13, "(cons 'a '(b c))", "(a b c)");
	assertEqual(14, "(cons 'a (cons 'b (cons 'c '())))", "(a b c)");
	assertEqual(15, "(cons 'a ())", "(a)");
	assertEqual(16, "(cons 'a '())", "(a)");
	assertEqual(17, "(if (eq 'a 'b) 'first 'second)", "second");
	assertEqual(18, "(if (eq () ()) 'first 'second)", "first");
	assertEqual(19, "((lambda (x) (cons x '(b))) 'a)", "(a b)");
	assertEqual(20, "((lambda (x y) (cons x (tail y))) 'z '(a b c))", "(z b c)");
	assertEqual(21, "((lambda (f) (f '(b c))) (lambda (x) (cons 'a x)))", "(a b c)");
	assertEqual(22, "((def subst (lambda (x y z) (if (atom z) (if (eq z y) x z) (cons (subst x y (head z)) (subst x y (tail z)))))) 'm 'b '(a b (a b c) d))", "(a m (a m c) d)");
	assertEqual(23, ":test", ":test");
	assertEqual(24, "':test", ":test");
	assertEqual(25, "(cons :a '(:b :c))", "(:a :b :c)");
	assertEqual(26, "(eq :a :a)", true);
	assertEqual(28, "(eq :a :b)", false);
	assertEqual(29, "`()", "()");
	assertEqual(30, "`~()", "()");
	assertEqual(31, "`(cons 'a ())", "(cons (quote a) ())");
	assertEqual(32, "'(cons 'a ())", "(cons (quote a) ())");
	assertEqual(33, "''(cons 'a ())", "(quote (cons (quote a) ()))");
	assertEqual(34, "`~'a", "a");
	assertEqual(35, "`(cons ~(if true 'first 'second) (cons ~(eq 'a 'b) ()))", "(cons first (cons false ()))");
	assertEqual(36, "(lambda (x y z) (cons y (cons z ()))) (def f (lambda (x) (eq x 'a))) (f 'a) (f 'b))", "(true false)")
}
