"use strict";

var NIL = [];

function _flattenList(memo, list) {
	memo.push(list.head);
	return list.tail == NIL ? memo : _flattenList(memo, list.tail);
}

function _createAtom(x) {
	return { "atom": x };
}

function _createList(head, tail) {
	return { "head": head, "tail": tail };
}

var quote = function(x) {
	return x;
};

var atom = function(x) {
	return _createAtom(x.atom || (x.list && !x.head));
};

var eq = function(args) {
	var a = args[0], b = args[1];
	return _createAtom((a.atom && a.atom == b.atom) || (a.list && b.list && !a.head && !b.head));
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
	var guard = args[0], thenAction = args[1], elseAction = args[2];
	return evaluate(evaluate(guard) ? thenAction : elseAction);
}

var apply = function(f, args) {
	return f(args);
}

function evaluate(x) {
	if (x.atom)
		return eval(x.atom);
	else {
		var f = evaluate(x.head);
		var args = _flattenList([], x.tail)
		if(f != branch && f != quote)
			for(var i = 0; i < args.length; i++)
				args[i] = evaluate(args[i]);
		return apply(f, args);
	}
}

function _splitAtPosition(text, pos) {
	return new Array(text.substring(0, pos), text.substring(pos+1, text.length));
}

function _decapitateComplex(code, brackets, pos) {
	if(brackets == 0 && pos > 0)
		return _splitAtPosition(code, pos);
	var c = code.charAt(pos);
	if(c == "(") brackets++;
	else if(c == ")") brackets--;

	return _decapitateComplex(code, brackets, pos+1);
}

function _decapitate(code) {
	if(code.charAt(0) == "(")
		return _decapitateComplex(code, 0, 0);
	else
		return _splitAtPosition(code, code.indexOf(" "));
}

function parse(code) {
	if(code.charAt(0) != "(")
		return _createAtom(code);
	else {
			var elements = _decapitate(code.substring(1, code.length-1));
			var head = parse(elements[0]);
			var tail = parse(elements[1]);
			var tailList = tail.atom ? _createList(tail, NIL) : tail;
			return _createList(head, tailList);
		};
}
