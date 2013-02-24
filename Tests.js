function runTests() {
	var counter = 0;
	var assertEqual = function(input, output) {
		if(output == stringify(evaluate(parse(input))))
			console.log("Test " + (counter++) + " successful: execution of '"
						+ input + "' produces '" + output + "'");
		else console.error("Test failed: execution of '"
							+ input + "' doesn't produce '" + output + "'");
	}

	assertEqual("(quote a)", "a");
	assertEqual("(quote (a b c))", "(a b c)");
	assertEqual("(atom (quote a))", true);
	assertEqual("(atom (quote (a b c)))", false);
	assertEqual("(atom (quote NIL))", true);
	assertEqual("(atom (atom (quote a)))", true);
	assertEqual("(atom (quote (atom (quote a))))", false);
	assertEqual("(eq (quote a) (quote a))", true);
	assertEqual("(eq (quote a) (quote b))", false);
	assertEqual("(eq (quote NIL) (quote NIL))", true);
	assertEqual("(head (quote (a b c)))", "a");
	assertEqual("(tail (quote (a b c)))", "(b c)");
	assertEqual("(cons (quote a) (quote (b c)))", "(a b c)");
	assertEqual("(cons (quote a) (cons (quote b) (cons (quote c) (quote NIL))))", "(a b c)");
	assertEqual("(cons (quote a) NIL)", "(a)");
	assertEqual("(cons (quote a) (quote NIL))", "(a)");
	assertEqual("(branch (eq (quote a) (quote b)) (quote first) (quote second))", "second");
	assertEqual("(branch (eq NIL NIL) (quote first) (quote second))", "first");
	assertEqual("((lambda (x) (cons x (quote (b)))) (quote a))", "(a b)");
	assertEqual("((lambda (x y) (cons x (tail y))) (quote z) (quote (a b c)))", "(z b c)");
	assertEqual("((lambda (f) (f (quote (b c)))) (lambda (x) (cons (quote a) x)))", "(a b c)");
	assertEqual("((def subst (lambda (x y z) (branch (atom z) (branch (eq z y) x z) (cons (subst x y (head z)) (subst x y (tail z)))))) (quote m) (quote b) (quote (a b (a b c) d)))", "(a m (a m c) d)");

}
