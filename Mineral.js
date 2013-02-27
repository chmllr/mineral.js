"use strict";

function isList(x) {
	return x instanceof Array;
}

function isNIL(x) {
	return isList(x) && x.length == 0;
}

var env = {

	"NIL": "NIL",

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
		if (list == "NIL") return [element];
		list.unshift(element);
		return list;
	},

	"if": function(args, localEnv) {
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

	"def": function(args) {
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
		if(["quote", "if", "lambda", "def"].indexOf(token) < 0)
			for(var i in args) args[i] = evaluate(args[i], localEnv);
		return f(args, localEnv);
	}
}

function tokenize(code, memo, pos) {
	if(code.length <= pos) return memo;
	var current = code.charAt(pos), quoted = false;
	if(current == "'") {
		current = code.charAt(++pos);
		quoted = true;
	}
	if(current == ")") throwSyntaxError(pos);
	if(current == "(") {
		var brackets = 1, oldPos = pos;
		while(brackets > 0) {
			pos++;
			if(brackets < 0 || pos == code.length) throwSyntaxError(pos);
			if(code.charAt(pos) == "(") brackets++;
			if(code.charAt(pos) == ")") brackets--;
		}
		var result = tokenize(code.substring(oldPos+1, pos), [], 0);
		memo.push(quoted ? ["quote", result] : result);
	} else if(current != " ") {
		var token = current;
		while(pos < code.length && code.charAt(++pos) != " ") token += code.charAt(pos);
		memo.push(quoted ? ["quote", token] : token);
	}
	return tokenize(code, memo, pos+1);
}

function throwSyntaxError(pos) {
	throw("Syntax error at position " + pos);
}

function parse(code) {
	return tokenize(code, [], 0)[0];
}

function stringify(code) {
	if(!isList(code)) return code;
	var output = "";
	for(var i in code) output += stringify(code[i]) + " ";
	return "(" + output.substring(0, output.length-1) + ")";
}

function normalize(code) {

	var patterns = [
		{ "pattern": /[\s\t\n\r]+/g, "substitution": " " }
	];

	for(var i in patterns)
		code = code.replace(patterns[i].pattern, patterns[i].substitution);
	
	return code.trim();
}

function interpret(input) {
	return stringify(evaluate(parse(normalize(input))));
}