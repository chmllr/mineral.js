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

function isSugared(token) {
	return ["'", "`", "~"].indexOf(token.charAt(0)) >= 0;
}

var mineral = {

	"nil": "nil",

	"quote": function(x) {
		return x;
	},

	"backquote": function(args, localEnv) {
		if (isList(args)) {
			if(isNIL(args)) return [];
			var token = args.shift(), result;
			if (isList(token))
				result = mineral.backquote(token);
			else
				result = token.charAt(0) == "~" ? evaluate(token.slice(1)) : token;
			var intermediate = mineral.backquote(args);
			intermediate.unshift(result);
			return intermediate
			
		} else
			return args.charAt(0) == "~" ? evaluate(args.slice(1)) : args;
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
	if (!isList(x)) return resolve(x, localEnv);
	else {
		var token = x[0];
		var f = evaluate(token, localEnv);
		var args = x.slice(1);
		if(["quote", "backquote", "if", "lambda", "def"].indexOf(token) < 0)
			for(var i in args) args[i] = evaluate(args[i], localEnv);
		if(["if", "backquote"].indexOf(token) < 0) args.push(localEnv);
		return f.apply(this, args);
	}
}

function tokenize(code, memo, pos) {
	if(code.length <= pos) return memo;
	var currentChar = code.charAt(pos);
	if(currentChar == " ") return tokenize(code, memo, pos+1);
	var token = nextToken(code.slice(pos));
	if(isSugared(token)) {
		var map = { "'": "quote", "`": "backquote", "~": "unquote" };
		operation = map[currentChar];
		memo.push([operation, tokenize(token)]);
	} else if(currentChar == "(")
		memo.push(tokenize(token, [], 0));
	else if(currentChar == ")") throwSyntaxError(pos);
	return tokenize(code, memo, pos + token.length)
}

function nextToken(code) {
	var currentChar = code.charAt(0), pos = 0;
	if(currentChar == "(") {
		var brackets = 1;
		while(brackets > 0) {
			pos++;
			if(brackets < 0 || pos == code.length) throwSyntaxError(pos);
			if(code.charAt(pos) == "(") brackets++;
			if(code.charAt(pos) == ")") brackets--;
		}
		return code.substring(1, pos);
	}
	var token = currentChar;
	if(isSugared(token))
		token += nextToken(code.slice(1));
	else
		while(pos < code.length && code.charAt(++pos) != " ") token += code.charAt(pos);
	return token;
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
		{ "pattern": /\(\)/g, "substitution": "nil" }, // () -> nil
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