"use strict";

var NIL = "NIL";

function isList(x) {
	return x instanceof Array;
}

function isNIL(x) {
	return isList(x) && x.length == 0;
}

var env = {
	"quote": function(args) {
		return args[0];
	},

	"atom":  function(args) {
		var x = args[0];
		return !isList(x) || isNIL(x);
	},

	"eq": function(args) {
		var a = args[0], b = args[1];
		return a == b || (isNIL(a) && isNIL(b));
	},

	"head":  function(args) {
		return args[0][0];
	},

	"tail": function(args) {
		var list = args[0];
		return list.slice(1,list.length);
	},

	"cons": function(args) {
		var element = args[0], list = args[1].slice(0);
		if (list == NIL) list = [];
		list.unshift(element);
		return list;
	},

	"branch": function(args, localEnv) {
		var guard = evaluate(args[0], localEnv), thenAction = args[1], elseAction = args[2];
		return evaluate(guard != false && !isNIL(guard) ? thenAction : elseAction, localEnv);
	},

	"lambda": function(args) {
		var bindings = args[0], exp = args[1];
		return function(largs) {
			var localEnv = {};
			for (var i in largs) localEnv[bindings[i]] = largs[i];
			return evaluate(exp, localEnv);
		}
	},

	"label": function(args) {
		var name = args[0], value = args[1];
		var locanEnv = {};
		locanEnv[name] = function(x) { return env[name](x); };
		env[name] = evaluate(value, locanEnv);
		return env[name];
	}
}

function resolve(value, locanEnv) {
	var result;
	if (locanEnv) {
		result = locanEnv[value];
		if (result) return result;
	}
	result = env[value];
	return result ? result : eval(value);
}

function evaluate(x, localEnv) {
	if (!isList(x)) return resolve(x, localEnv);
	else {
		var token = x[0];
		var f = evaluate(token, localEnv);
		var args = x.slice(1);
		if(["quote", "branch", "lambda", "label"].indexOf(token) < 0)
			for(var i in args) args[i] = evaluate(args[i], localEnv);
		return f(args, localEnv);
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
		for(var i in tokens) tokens[i] = parse(tokens[i]);
			return tokens;
	};
}

function stringify(code) {
	if(!isList(code)) return code;
	var output = "";
	for(var i in code) output += stringify(code[i]) + " ";
	return "(" + output.substring(0, output.length-1) + ")";
}

function normalize(code) {
	/**
	replace all whitespaces by a single space
	replace all () by NIL
	*/
}