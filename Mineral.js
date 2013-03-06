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

var sugarMap = { "'" : "quote", "`": "backquote", "~": "unquote"};

var mineral = {

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
		if(isNIL(list)) throw("Empty list has no tail!");
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
		return function() {
			var args = Array.prototype.slice.call(arguments).slice(0, bindings.length);
			var localEnv = {};
			for (var i in args) localEnv[bindings[i]] = args[i];
			return evaluate(exp, localEnv);
		}
	},

	"def": function(name, value) {
		var localEnv = {};
		localEnv[name] = function(x) { return mineral[name](x); };
		mineral[name] = evaluate(value, localEnv);
		return mineral[name];
	},

	"backquote": function(args, localEnv) {
		if(isNIL(args)) return [];
		if (isList(args)) {
			var token = args.shift();
			if(token == sugarMap["~"]) return evaluate(args[0]);
			var result = (isNIL(args) ? [] : mineral.backquote(args))
			result.unshift(mineral.backquote(token));
			return result;
		}
		return args;
	},

	"evaljs": function(string) {
		return eval(string);
	}
}

function resolve(value, localEnv) {
	var result;
	if (localEnv) {
		result = localEnv[value];
		if (result) return result;
	}
	result = mineral[value];
	if(result) return result;
	return isSymbol(value) ? value : mineral.evaljs(value);
}

function evaluate(x, localEnv) {
	if(isNIL(x)) return [];
	if (!isList(x)) return resolve(x, localEnv);
	else {
		var token = x[0];
		var f = evaluate(token, localEnv);
		var args = x.slice(1);
		if(["quote", "backquote", "if", "lambda", "def"].indexOf(token) < 0)
			for(var i in args) args[i] = evaluate(args[i], localEnv);
		if(["if", "backquote"].indexOf(token) >= 0) args.push(localEnv);
		return f.apply(this, args);
	}
}

function tokenize(code, memo, pos) {
	if(code.length <= pos) return memo;
	var current = code.charAt(pos), result = "", sugared = false, ops = [];
	if (current == " ") return tokenize(code, memo, pos+1);
	while(Object.keys(sugarMap).indexOf(current) >= 0) {
		ops.unshift(sugarMap[current]);
		current = code.charAt(++pos);
		sugared = true;
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
		result = tokenize(code.substring(oldPos+1, pos), [], 0);
	} else
		while(pos < code.length && code.charAt(pos) != " ") result += code.charAt(pos++);
	if(sugared)
		for(var i in ops)
			result = [ops[i], result];
	memo.push(result);
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
		{ "pattern": /;.*[\n\r]/g, "substitution": "" }, // comments
		{ "pattern": /[\s\t\n\r]+/g, "substitution": " " } // whitespace normalization
	];
	for(var i in patterns)
		code = code.replace(patterns[i].pattern, patterns[i].substitution);
	return code.trim();
}

function interpret(input) {
	return stringify(evaluate(parse(normalize(input))));
}

function loadFiles() {
    var httpRequest = new XMLHttpRequest();
	var processText = function() {
		if (httpRequest.readyState === 4 && httpRequest.status === 200) {
			var content = "((lambda ()) " + httpRequest.responseText + ")";
			evaluate(parse(normalize(content)));
		}
	}
    httpRequest.onreadystatechange = processText;
	for(var i = 0; i < arguments.length; i++) {
		var fileName = arguments[i];
		httpRequest.onerror = function () { console.error("Couldn't load " + fileName); }
	    httpRequest.open('GET', fileName);
	    httpRequest.send();
	}
}
