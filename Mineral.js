"use strict";

function isSymbol(x) {
	return typeof(x) == "string" && ":" == x.charAt(0);
}

function isList(x) {
	return x instanceof Array;
}

function isNIL(x) {
	return isList(x) && x.length == 0;
}

var env = {

	"nil": "nil",

	"quote": function(x) {
		return x;
	},

	"atom":  function(x) {
		return !isList(x) || isNIL(x);
	},

	"eq": function(a, b) {
		return a == b || (isNIL(a) && isNIL(b));
	},

	"head":  function(list) {
		return list[0];
	},

	"tail": function(list) {
		return list.slice(1,list.length);
	},

	"cons": function(element, list) {
		if(list == "nil") return [element];
		list.unshift(element);
		return list;
	},

	"if": function(guard, thenAction, elseAction, localEnv) {
		var value = evaluate(guard, localEnv);
		return evaluate(value != false && !isNIL(value) ? thenAction : elseAction, localEnv);
	},

	"lambda": function(bindings, exp) {
		var lambda = function(args) {
			var localEnv = {};
			for (var i in args) localEnv[bindings[i]] = args[i];
			return evaluate(exp, localEnv);
		}
		lambda["expectsArray"] = true;
		return lambda;
	},

	"def": function(name, value) {
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
	if(result) return result;
	return isSymbol(value) ? value : eval(value);
}

function evaluate(x, localEnv) {
	if (!isList(x)) return resolve(x, localEnv);
	else {
		var token = x[0];
		var f = evaluate(token, localEnv);
		var args = x.slice(1);
		if(["quote", "if", "lambda", "def"].indexOf(token) < 0)
			for(var i in args) args[i] = evaluate(args[i], localEnv);
		if(token == "if") args.push(localEnv);
		if(f.expectsArray) args = [args];
		return f.apply(this, args);
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
		{ "pattern": /\(\)/g, "substitution": "nil" },
		{ "pattern": /[\s\t\n\r]+/g, "substitution": " " }
	];

	for(var i in patterns)
		code = code.replace(patterns[i].pattern, patterns[i].substitution);
	
	return code.trim();
}

function interpret(input) {
	return stringify(evaluate(parse(normalize(input))));
}