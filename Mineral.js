"use strict";

function _flattenList(memo, list) {
	if (!list.head) return memo;
	memo.push(list.head);
	return flattenList(memo, list.tail);
}

function _createAtom(x) {
	return {
		"atom": true,
		"value": x
	};
}

var quote = function(x) {
	return x;
};

var atom = function(x) {
	return _createAtom(x.atom || (x.list && !x.head));
};

var eq = function(args) {
	var a = args[0], b = args[1];
	return _createAtom(	(a.atom && b.atom && a.value == b.value) || 
						(a.list && b.list && !a.head && !b.head));
}

var head = function(list) {
	return list.head;
}

var tail = function(list) {
	return list.tail;
}

var cons = function(args) {
	var element = args[0], list = args[1];
	return { "head": element, "tail": list };
}

var branch = function(args) {
	var guard = args[0], thenAction = args[1], elseAction = args[2];
	return eval(eval(guard) ? thenAction : elseAction);
}

function eval(x) {
	if (x.atom)
		return x.value;
	else {
		var f = x.head;
		var args = _flattenList([], x.tail)
		if(f != cond && f != quote)
			for(var i = 0; i < args.length; i++)
				args[i] = eval(args[i]);
		return f(args);
	}
}