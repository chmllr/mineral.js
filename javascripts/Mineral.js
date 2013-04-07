"use strict";

function isList(x) {
    return x instanceof Array;
}

function isFunction(f) {
    return typeof f == "function";
}

function isNumber(x) {
    return typeof x == "number";
}

function isBoolean(x) {
    return typeof x == "boolean";
}

function isString(x) {
    return typeof x == "string";
}

function isNIL(x) {
    return isList(x) && x.length == 0;
}

function isAtom(x) {
    return x instanceof Atom;
}

function isPrimitive(x) {
    return isNIL(x) || !isList(x);
}

function Atom (value) {
    this.value = value;
}

function isJSReference(x) {
    return isString(x) && x.indexOf("js/") == 0;
} 

function createEnvironment(oldEnv) {
    var newEnv = {};
    if(oldEnv) for(var key in oldEnv) newEnv[key] = oldEnv[key];
    return newEnv;
}

var cache = { }, cacheBlackList = ["event"];

function cachedEval(object) {
    if(!isAtom(object)) return object;
    var key = object.value;
    var result = cache[key];
    if(result != undefined) return result;
    var result = eval(key);
    if(cacheBlackList.indexOf(key) == -1) cache[key] = result;
    return result;
}

var atoms = { "quote" : new Atom("quote"), 
            "backquote": new Atom("backquote"),
            "unquote": new Atom("unquote"),
            "jswindow": new Atom("js/window") };

var sugarMap = { "'" : atoms.quote, "`": atoms.backquote, "~": atoms.unquote };

var enclosureMap = { '(' : ')', '"' : '"', "[": "]" };

var mineral = {

    "quote": function(x) {
        return x;
    },

    "atom":  function(x) {
        return isPrimitive(x);
    },

    "eq": function(a, b) {
        return a == b 
            || (isNIL(a) && isNIL(b)) 
            || isAtom(a) && isAtom(b) && a.value == b.value;
    },

    "head":  function(list) {
        if(!isList(list)) throw("Exception in 'head': " + list + " is not a list!");
        return list[0];
    },

    "tail": function(list) {
        if(isNIL(list) || !isList(list)) throw "Exception in 'tail': can't work on " + list + "!";
        return list.slice(1);
    },

    "cons": function(element, list) {
        return [element].concat(list);
    },

    "if": function(guard, thenAction, elseAction) {
        var localEnv = this.localEnv;
        var value = evaluate(guard, localEnv);
        return evaluate(!isNIL(value) && value ? thenAction : elseAction, localEnv);
    },

    "fn": function(bindings, exp) {
        var optionalArgsSep = bindings.indexOf("&"), optionalBinding;
        if(optionalArgsSep >= 0 && bindings.length > optionalArgsSep+1) {
            optionalBinding = bindings[optionalArgsSep+1];
            bindings = bindings.slice(0,optionalArgsSep);
        }
        var lambda = function() {
            var args = Array.prototype.slice.call(arguments),
                localEnv = createEnvironment(this.localEnv);
            for (var i in bindings) localEnv[bindings[i].value] = args[i];
            if(optionalArgsSep >= 0)
                localEnv[optionalBinding.value] = args.slice(bindings.length);
            return evaluate(exp, localEnv);
        };
        lambda["lambda"] = true;
        return lambda;
    },

    "def": function(name, value) {
        var localEnv = this.localEnv;
        mineral[name.value] = evaluate(value, localEnv);
        if(name.value.indexOf("-") >= 0) mineral[name.value.replace(/-/g, "_")] = mineral[name.value] 
        return mineral[name.value];
    },

    "apply": function(f, args, token){
        return f.apply(this, args);
    },

    "externalcall": function() {
        var args = Array.prototype.slice.call(arguments);
        var object = cachedEval(args[0]), field = args[1], args = args.slice(2);
        var callee = object[field];
        var result = isFunction(callee)
                        ? callee.apply(object, args)
                        : (args.length > 0 ? object[field] = args[0] : callee);
        return result;
    },

    "infixcall": function(op, a, b){
        switch(op.value){
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            case '<': return a < b;
            case '>': return a > b;
            case '>=': return a >= b;
            case '<=': return a <= b;
            case '^': return a ^ b;
            case '&': return a & b;
            case '|': return a | b;
        }
    },

    "true": true,
    "false": false
}

function resolve(id, localEnv) {
    if(id == undefined 
        || isNumber(id)
        || isBoolean(id)
        || isString(id)
        || isJSReference(id.value)) return id;
    if(localEnv && id.value in localEnv) return localEnv[id.value];
    if(id.value in mineral) return mineral[id.value];
    throw("The identifier '" + id.value + "' can't be resolved.");
}

function evaluate(value, localEnv) {
    if(isNIL(value)) return [];
    if (!isList(value)) return resolve(value, localEnv);
    var func = value[0], token = func.value, args = value.slice(1), macro = false;
    if(token == "macro") {
        macro = true;
        token = "fn"
        func = new Atom(token);
    }
    var localMethodCall = isString(token) && token.charAt(0) == ".";
    if(localMethodCall || isJSReference(token)) {
        var object = localMethodCall ? evaluate(value[1], localEnv) : atoms.jswindow;
        object = isJSReference(object.value) ? new Atom(object.value.slice(3)) : object;
        args = [[atoms.quote, object], [atoms.quote, localMethodCall ? token.slice(1) : token.slice(3)]];
        args = args.concat(value.slice(localMethodCall ? 2 : 1));
        token = "externalcall";
        func = new Atom(token);
    }
    var f = evaluate(func, localEnv);
    if(["quote", "if", "fn", "def"].indexOf(token) < 0 && !f.macro)
        for(var i in args) args[i] = evaluate(args[i], localEnv);
    mineral.localEnv = localEnv;
    var result = mineral.apply(f, args, token);
    if(macro) result["macro"] = macro;
    return result;
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
    if(current == ")") throwSyntaxError(pos, code);
    if(Object.keys(enclosureMap).indexOf(current) >= 0) {
        var enclosures = 1, oldPos = pos, opener = current, closer = enclosureMap[current];
        while(enclosures > 0) {
            pos++;
            if(enclosures < 0 || pos == code.length) throwSyntaxError(pos, code);
            current = code.charAt(pos);
            if(current == "\\") {
                pos++;
                continue;
            }
            else if(opener != closer && current == opener) enclosures++;
            else if(current == closer) enclosures--;
        }
        result = opener != '"'
            ? tokenize(code.substring(oldPos+1, pos), [], 0)
            : eval('"' + code.substring(oldPos+1, pos) + '"');
    } else {
        while(pos < code.length && code.charAt(pos) != " ") result += code.charAt(pos++);
        if(!isNaN(result)) result = result | 0;
        if(result == "true" || result == "false") result = result == "true";
        if(isString(result) && result != "&" && result != "#_") result = new Atom(result);
    }
    if(sugared)
        for(var i in ops)
            result = [ops[i], result];
    if(memo[memo.length-1] == "#_") memo.pop(); else memo.push(result); 
    return tokenize(code, memo, pos+1);
}

function expand(code) {
    if(isPrimitive(code)) return code;
    for(var i in code) code[i] = expand(code[i]);
    if(isPrimitive(code[0]) && code[0].value in mineral && mineral[code[0].value].macro) {
        var result = evaluate(code)
        return code[0].value == "backquote" ? evaluate(result) : result;
    } else return code;
}

function throwSyntaxError(pos, code) {
    throw("Syntax error at position " + pos + ": " + code);
}

function parse(string) {
    return tokenize(string, [], 0)[0];
}

function stringify(code) {
    if(isAtom(code)) return code.value;
    if(isString(code)) return JSON.stringify(code);
    if(!isList(code)) return code + '';
    var output = "";
    for(var i in code) output += stringify(code[i]) + " ";
    return "(" + output.substring(0, output.length-1) + ")";
}

function normalize(string) {
    var patterns = [
        { "pattern": /;.*($|\n|\r)/g, "substitution": "" }, // comments
        { "pattern": /[\s\t\n\r]+/g, "substitution": " " }, // whitespace normalization
        { "pattern": /%([a-zA-Z\-\s]*?)?\./g, "substitution": "fn ($1)" } // lambda sugar
    ];
    for(var i in patterns)
        string = string.replace(patterns[i].pattern, patterns[i].substitution);
    return string.trim();
}

function interpret(input) {
    try {
        return stringify(evaluate(expand(parse(normalize(input)))));
    } catch(error) {
        return error;
    }
}

function loadFiles() {
    var httpRequest = new XMLHttpRequest(), content = "", args = arguments, fileNr = 0;
    var loadFile = function() {
        var fileName = args[fileNr++];
        console.log("Loading " + fileName + "...");
        httpRequest.onerror = function () { console.error("Couldn't load " + fileName); }
        httpRequest.open('GET', fileName);
        httpRequest.send();
    };
    var processText = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            content += httpRequest.responseText;
            if(args.length == fileNr) {
                var exps = parse(normalize("(" + content + ")"));
                for(var i in exps) evaluate(expand(exps[i]));
            } else loadFile();
        }
    };
    httpRequest.onreadystatechange = processText;
    loadFile();
}
