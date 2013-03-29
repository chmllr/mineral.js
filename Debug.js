function patchFn(f, key, pre, post){
    return function () {
        pre(key, arguments);
        var result = f.apply(f, arguments);
        post(key, result);
        return result;
    }
}

function patchMineral (pre, post) {
    var id = function(){};
    pre = pre ? pre : id;
    post = post ? post : id;
    for(var key in mineral)
    {
        mineral[key] = patchFn(mineral[key], key, pre, post);
        // we only want to patch primitives
        if(key == "externalcall") return;
    }
}

var printFnName = function () {
    patchMineral(function(name, args){
            console.log(name)
    })
}
