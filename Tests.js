function assertEqual (n, input, output) {
	if(output == interpret(input))
		console.log("Test " + n + " successful: execution of '"
					+ input + "' produces '" + output + "'");
	else console.error("Test failed: execution of '"
						+ input + "' doesn't produce '" + output + "'");
}



function runTests() {

	assertEqual(1, "(quote a)", "a");
	assertEqual(2, "(quote (a b c))", "(a b c)");
	assertEqual(3, "(atom (quote a))", true);
	assertEqual(4, "(atom (quote (a b c)))", false);
	assertEqual(5, "(atom (quote NIL))", true);
	assertEqual(6, "(atom (atom (quote a)))", true);
	assertEqual(7, "(atom (quote (atom (quote a))))", false);
	assertEqual(8, "(eq (quote a) (quote a))", true);
	assertEqual(9, "(eq (quote a) (quote b))", false);
	assertEqual(10, "(eq (quote NIL) (quote NIL))", true);
	assertEqual(11, "(head (quote (a b c)))", "a");
	assertEqual(12, "(tail (quote (a b c)))", "(b c)");
	assertEqual(13, "(cons (quote a) (quote (b c)))", "(a b c)");
	assertEqual(14, "(cons (quote a) (cons (quote b) (cons (quote c) (quote NIL))))", "(a b c)");
	assertEqual(15, "(cons (quote a) NIL)", "(a)");
	assertEqual(16, "(cons (quote a) (quote NIL))", "(a)");
	assertEqual(17, "(if (eq (quote a) (quote b)) (quote first) (quote second))", "second");
	assertEqual(18, "(if (eq NIL NIL) (quote first) (quote second))", "first");
	assertEqual(19, "((lambda (x) (cons x (quote (b)))) (quote a))", "(a b)");
	assertEqual(20, "((lambda (x y) (cons x (tail y))) (quote z) (quote (a b c)))", "(z b c)");
	assertEqual(21, "((lambda (f) (f (quote (b c)))) (lambda (x) (cons (quote a) x)))", "(a b c)");
	assertEqual(22, "((def subst (lambda (x y z) (if (atom z) (if (eq z y) x z) (cons (subst x y (head z)) (subst x y (tail z)))))) (quote m) (quote b) (quote (a b (a b c) d)))", "(a m (a m c) d)");

}
