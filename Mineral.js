"use strict";

var NIL = "NIL";

function isList(x) {
	return x instanceof Array;
}

function isNIL(x) {
	return isList(x) && x.length == 0;
}

var env = {
	"quote": function(x) {
		return x;
	},

	"atom":  function(x) {
		return !isList(x) || isNIL(x);
	},

	"eq": function(args) {
		var a = args[0], b = args[1];
		return a == b || (isNIL(a) && isNIL(b));
	},

	"head":  function(list) {
		return list[0];
	},

	"tail": function(list) {
		return list.slice(1,list.length);
	},

	"cons": function(args) {
		var element = args[0], list = args[1].slice(0);
		if (list == NIL) list = [];
		list.unshift(element);
		return list;
	},

	"branch": function(args) {
		var guard = evaluate(args[0]), thenAction = args[1], elseAction = args[2];
		return evaluate(guard != false && !isNIL(guard) ? thenAction : elseAction);
	}
}

function apply(f, args) {
	return f(args.length == 1 ? args[0] : args);
}

function evaluate(x) {
	if (!isList(x)) {
		var value = env[x];
		if(value) return value;
		return eval(x);
	}
	else {
		var token = x.shift();
		var f = evaluate(token);
		var args = x;
		if(token != "quote" && token != "branch")
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
	var pair = code.charAt(0) == "(" 
		? _decapitate(code, 0, 0)
		: _splitAtPosition(code, code.indexOf(" "));
	if (pair[0] == "") return [pair[1]];
	if (pair[1] == "") return [pair[0]];
	var intermediate = _tokenize(pair[1]);
	intermediate.unshift(pair[0]);
	return intermediate;
}

function parse(code) {
	if(code.charAt(0) != "(")
		return code;
	else {
		var tokens = _tokenize(code.substring(1, code.length-1));
		for(var i in tokens) tokens[i] = parse(tokens[i]); return tokens;
	};
}

function stringify(code) {
	if(!isList(code)) return code;
	var output = "";
	for(var i in code) output += stringify(code[i]) + " ";
	output = output.substring(0, output.length-1);
	return "(" + output + ")";
}

function normalize(code) {
	/**
	replace all whitespaces by a single space
	replace all () by NIL
	*/
}