"use strict";

function isList(x) {
    return x instanceof Array;
}

function isNIL(x) {
    return isList(x) && x.length == 0;
}

function isString(x) {
    return typeof x == "string";
}

function isMineralString(x) {
    return isString(x) && x.match(/^".*"$/);
}

function mrlStringToJSString(string) {
    return string.slice(1,string.length-1)
                .replace(/\\+/g, '\\')
                .replace(/\\r/g, "\r")
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"');
}

function isJSReference(x) {
    return isString(x) && x.indexOf("js/") == 0;
} 

function isFunction(f) {
    return typeof f == "function";
}

function isEnvironment(object) {
    return typeof object == "object" && object.mineralEnvironmentObject == true;
}

function createEnvironment(oldEnv) {
    var newEnv = {};
    // FIXME: clone arrays appropriatelly!
    if(isEnvironment(oldEnv)) for(var key in oldEnv) newEnv[key] = oldEnv[key];
    else newEnv.mineralEnvironmentObject = true;
    return newEnv;
}

var cache = { }, cacheBlackList = ["event"];

function cachedEval(object) {
    if(!isString(object)) return object;
    if(isMineralString(object)) return mrlStringToJSString(object);
    var result = cache[object];
    if(result != undefined) return result;
    var result = eval(object);
    if(cacheBlackList.indexOf(object) == -1) cache[object] = result;
    return result;
}

var sugarMap = { "'" : "quote", "`": "backquote", "~": "unquote" };

var enclosureMap = { '(' : ')', '"' : '"', "[": "]" };

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
        if(!isList(list)) throw("Exception in 'head': " + list + " is not a list!");
        return list[0];
    },

    "tail": function(list) {
        if(isNIL(list)) throw("Empty list has no tail!");
        if(!isList(list)) throw "Exception in 'tail': " + list + " is not a list!";
        return list.slice(1,list.length);
    },

    "cons": function(element, list) {
        return [element].concat(list);
    },

    "if": function(localEnv, guard, thenAction, elseAction) {
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
                localEnv = isEnvironment(args[0]) ? args.shift() : createEnvironment();
            for (var i in bindings) localEnv[bindings[i]] = args[i];
            if(optionalArgsSep >= 0)
                localEnv[optionalBinding] = args.slice(bindings.length);
            return evaluate(exp, localEnv);
        };
        lambda["lambda"] = true;
        return lambda;
    },

    "def": function(localEnv, name, value) {
        localEnv = createEnvironment(localEnv);
        localEnv[name] = function(x) { return mineral[name](x); };
        mineral[name] = evaluate(value, localEnv);
        if(name.indexOf("-") >= 0) mineral[name.replace(/-/g, "_")] = mineral[name] 
        return mineral[name];
    },

    "apply": function(localEnv, f, args, token){
        if(["if", "apply", "def"].indexOf(token) >= 0 || f.lambda) args.unshift(localEnv);
        return f.apply(this, args);
    },

    "externalcall": function() {
        var args = Array.prototype.slice.call(arguments);
        var object = cachedEval(args[0]), field = args[1], args = args.slice(2);
        for(var i in args) args[i] = isMineralString(args[i]) ? mrlStringToJSString(args[i]) : args[i];
        var callee = object[field];
        var result = isFunction(callee)
                        ? callee.apply(object, args)
                        : (args.length > 0 ? object[field] = args[0] : callee);
        return isString(result) ? JSON.stringify(result) : result;
    },

    "infixcall": function(op, a, b){
        switch(op){
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
        || isMineralString(id) 
        || isJSReference(id)
        || typeof id == "number") return id;
    if(id in localEnv) return localEnv[id];
    if(id in mineral) return mineral[id];
    throw("The identifier '" + id + "' can't be resolved.");
}

function evaluate(value, localEnv) {
    localEnv = createEnvironment(localEnv);
    if(isNIL(value)) return [];
    if (!isList(value)) return resolve(value, localEnv);
    var token = value[0], args = value.slice(1), macro = false;
    if(token == "macro") {
        macro = true;
        token = "fn";
    }
    var localMethodCall = isString(token) && token.charAt(0) == ".";
    if(localMethodCall || isJSReference(token)) {
        var object = localMethodCall ? evaluate(value[1], localEnv) : "js/window";
        object = isJSReference(object) ? object.slice(3) : object;
        args = [["quote", object], ["quote", localMethodCall ? token.slice(1) : token.slice(3)]];
        args = args.concat(value.slice(localMethodCall ? 2 : 1));
        token = "externalcall";
    }
    var f = evaluate(token, localEnv);
    if(["quote", "if", "fn", "def"].indexOf(token) < 0 && !f.macro)
        for(var i in args) args[i] = evaluate(args[i], localEnv);
    var result = mineral.apply(localEnv, f, args, token);
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
            : opener + code.substring(oldPos+1, pos) + closer;
    } else while(pos < code.length && code.charAt(pos) != " ") result += code.charAt(pos++);
    if(!isList(result) && !isNaN(result)) result = result | 0;
    if(result == "true" || result == "false") result = result == "true";
    if(sugared)
        for(var i in ops)
            result = [ops[i], result];
    if(memo[memo.length-1] == "#_") memo.pop(); else memo.push(result); 
    return tokenize(code, memo, pos+1);
}

function expand(code) {
    if(isNIL(code) || !isList(code)) return code;
    for(var i in code) code[i] = expand(code[i]);
    if(code[0] in mineral && mineral[code[0]].macro) {
        var result = evaluate(code)
        return code[0] == "backquote" ? evaluate(result) : result;
    } else return code;
}

function throwSyntaxError(pos, code) {
    throw("Syntax error at position " + pos + ": " + code);
}

function parse(string) {
    return tokenize(string, [], 0)[0];
}

function stringify(code) {
    if(!isList(code)) return code + "";
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

