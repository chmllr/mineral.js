"use strict";

function _createAtom(x) {
	return { "atom": x };
}

var NIL = _createAtom("NIL");

function _flattenList(memo, list) {
	memo.push(list.head);
	return list.tail == NIL ? memo : _flattenList(memo, list.tail);
}

function _createList(head, tail) {
	return { "head": head, "tail": tail };
}

function _createListRec(list) {
	if (list.length == 1) return _createList(list[0], NIL);
	return { "head": list.shift(), "tail": _createListRec(list) };
}

var quote = function(x) {
	return x;
};

var atom = function(x) {
	return _createAtom(x.atom != undefined);
};

var eq = function(args) {
	var a = args[0], b = args[1];
	return _createAtom(a.atom != undefined && a.atom == b.atom);
}

var head = function(list) {
	return list.head;
}

var tail = function(list) {
	return list.tail;
}

var cons = function(args) {
	var element = args[0], list = args[1];
	return _createList(element, list);
}

var branch = function(args) {
	var guard = evaluate(args[0]), thenAction = args[1], elseAction = args[2];
	return evaluate(guard.atom != false && guard != NIL ? thenAction : elseAction);
}

var apply = function(f, args) {
	return f(args.length == 1 ? args[0] : args);
}

function evaluate(x) {
	if (x.atom != undefined)
		return eval(x.atom);
	else {
		var f = evaluate(x.head);
		var args = _flattenList([], x.tail)
		if(f != branch && f != quote)
			for(var i in args) args[i] = evaluate(args[i]);
		return apply(f, args);
	}
}

function _splitAtPosition(text, pos) {
	return [text.substring(0, pos), text.substring(pos+1, text.length)];
}

function _decapitate(code, brackets, pos) {
	if(brackets == 0 && pos > 0) return _splitAtPosition(code, pos);
	var c = code.charAt(pos);
	if(c == "(") brackets++;
	else if(c == ")") brackets--;
	return _decapitate(code, brackets, pos+1);
}

function _tokenize(code) {
	var pair = code.charAt(0) == "(" ? _decapitate(code, 0, 0)
									 : _splitAtPosition(code, code.indexOf(" "));
	if (pair[0] == "") return [pair[1]];
	if (pair[1] == "") return [pair[0]];
	var intermediate = _tokenize(pair[1]);
	intermediate.unshift(pair[0]);
	return intermediate;
}

function parse(code) {
	if(code.charAt(0) != "(")
		return code == "NIL" ? NIL : _createAtom(code);
	else {
			var tokens = _tokenize(code.substring(1, code.length-1));
			for(var i in tokens) tokens[i] = parse(tokens[i]);
			return _createListRec(tokens);
		};
}

function stringify(code) {
	if(code.atom != undefined) return code.atom;
	if(code.tail == NIL) return "(" + stringify(code.head) + ")";
	var flattened = _flattenList([], code);
	var output = "";
	for(var i in flattened) output += stringify(flattened[i]) + " ";
	output = output.substring(0, output.length-1);
	return "(" + output + ")";
}

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

}

function normalize(code) {
	/**
	replace all whitespaces by a single space
	replace all () by NIL
	*/
}