function assertEqual (n, input, output) {
	if(output == interpret(input))
		console.log("Test " + n + " successful: execution of '"
					+ input + "' produces '" + output + "'");
	else console.error("Test failed: execution of '"
						+ input + "' doesn't produce '" + output + "'");
}



function runTests() {

	assertEqual(1, "'a", "a");
	assertEqual(2, "'(a b c)", "(a b c)");
	assertEqual(3, "(atom 'a)", true);
	assertEqual(4, "(atom '(a b c))", false);
	assertEqual(5, "(atom 'NIL)", true);
	assertEqual(6, "(atom (atom 'a))", true);
	assertEqual(7, "(atom (atom 'a))", false);
	assertEqual(8, "(eq 'a 'a)", true);
	assertEqual(9, "(eq 'a 'b)", false);
	assertEqual(10, "(eq 'NIL 'NIL)", true);
	assertEqual(11, "(head '(a b c))", "a");
	assertEqual(12, "(tail '(a b c))", "(b c)");
	assertEqual(13, "(cons 'a '(b c))", "(a b c)");
	assertEqual(14, "(cons 'a (cons 'b (cons 'c' 'NIL)))", "(a b c)");
	assertEqual(15, "(cons 'a NIL)", "(a)");
	assertEqual(16, "(cons 'a 'NIL)", "(a)");
	assertEqual(17, "(if (eq 'a 'b) 'first 'second)", "second");
	assertEqual(18, "(if (eq NIL NIL) 'first 'second)", "first");
	assertEqual(19, "((lambda (x) (cons x '(b))) 'a)", "(a b)");
	assertEqual(20, "((lambda (x y) (cons x (tail y))) 'z '(a b c))", "(z b c)");
	assertEqual(21, "((lambda (f) (f '(b c))) (lambda (x) (cons 'a x)))", "(a b c)");
	assertEqual(22, "((def subst (lambda (x y z) (if (atom z) (if (eq z y) x z) (cons (subst x y (head z)) (subst x y (tail z)))))) 'm 'b '(a b (a b c) d))", "(a m (a m c) d)");

}
