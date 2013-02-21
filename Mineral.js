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

function parse(code) {
	if(code.charAt(0) != "(")
		return _createAtom(code);
	else {
			var elements = code.substring(1, code.length-1).split(" ");
			var head = parse(elements.shift());
			var tail = parse(elements.join(" "));
			var tailList = tail.atom ? _createList(tail, NIL) : tail;
			return _createList(head, tailList);
		};
}
