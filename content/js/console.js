window.app = {};
(function() {
    
    var prefs = require("ko/prefs");
    var win = require("ko/windows").getMain();
    var elem = {
        inputMock: document.getElementById("input-mock"),
        console: document.getElementById("output").parentNode,
        output: document.getElementById("output")
    }
    
    var history = JSON.parse(prefs.getString("git_console_history", "[]"));
    var historyPos = -1;

    var charWidth = elem.inputMock.offsetWidth;
    var charHeight = elem.inputMock.offsetHeight / 2;
    
    this.print = function(type, data, dontFormat)
    {
        var li = document.createElement("li");
        li.classList.add(type);
        
        var dataType = _getType(data);
        
        if ( ! dontFormat)
        {
            data = this.formatComplex(data);
        }
        else
            data = document.createTextNode(data);
        
        var message = document.createElement("div");
        message.classList.add("message");
        if ( ! dontFormat) message.classList.add("type-" + dataType);
        message.appendChild(data);
        
        li.appendChild(message);
        
        this.printLi(li);
    }
    
   
    this.formatComplex = function(aThing) 
    {
        var nonIterable = ["function", "undefined", "null", "boolean", "string", "float", "number"];
        var type = _getType(aThing);
        
        var li = document.createElement("li");
        li.classList.add("complex-format");
        li.classList.add("type-" + type);

        if ((typeof aThing == "object") && nonIterable.indexOf(type) == -1)
        {
            try
            {
                var start = '{', end = '}';
                if (type == "array") start = '[', end = ']';
                
                var wrap = document.createElement("label");
                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                wrap.appendChild(checkbox);
                
                var inner = document.createElement("div");
                
                if (type == "element")
                    inner.appendChild(this.formatElement(aThing));
                else
                {
                    
                    var innerStr = start;
                    var children = [], len = 0, childType, childValue, hasMore = false;
                    for (var k of Object.getOwnPropertyNames(aThing))
                    {
                        if (++len == 5)
                        {
                            hasMore = true;
                            break;
                        }
                        
                        if ( ! aThing.hasOwnProperty(k)) continue;
                        childType = _getType(aThing[k]);
                        if (["undefined", "null", "boolean", "string", "float", "number"].indexOf(childType) != -1)
                            childValue = JSON.stringify(aThing[k]);
                    }
                    
                    if (hasMore) children.push("..");
                    innerStr += children.join(", ") + end;
                    inner.textContent = innerStr;
                }
                wrap.appendChild(inner);
                li.appendChild(wrap);
                
                checkbox.addEventListener("click", function()
                {
                    if (checkbox.__initialized)
                    {
                        li.getElementsByTagName("ul")[0].style.display = checkbox.checked ? "block" : "none";
                        return;
                    }
                    checkbox.__initialized = true;
                    
                    var ul = document.createElement("ul"), subLi;
                    _keysSorted(aThing, false).forEach(function(k)
                    {
                        var proto = false;
                        if ( ! aThing.hasOwnProperty(k)) proto = true;
                        try
                        {
                            subLi = this.formatComplex(aThing[k])
                        }
                        catch (e)
                        {
                            subLi = document.createElement("li");
                            subLi.appendChild(document.createTextNode("<inaccessible>"));
                        }
                        if (proto) subLi.classList.add("prototype");
                        var key = document.createElement("span");
                        key.classList.add("object-key");
                        key.textContent = k + ": ";
                        subLi.insertBefore(key, subLi.firstChild);
                        ul.appendChild(subLi);
                    }.bind(this));
                    
                    li.appendChild(ul);
                }.bind(this));
                
                return li;
            }
            catch (e)
            {}
        }
        
        try
        {
            var str;
            if (aThing === null)
                str = "" // The type gives all the information needed
            else
                str = aThing.toString();
             
            var _str = str; //_ellipsis(str, 50);
            if (str != _str)
            {
                if (type == "string") _str = `"${_str}"`;
                var label = document.createElement("label");
                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                label.appendChild(checkbox);
                
                var elem = document.createElement("div");
                elem.textContent = _str;
                label.appendChild(elem);
                
                elem = document.createElement("div");
                elem.classList.add("expanded");
                elem.textContent = str;
                label.appendChild(elem);
                
                li.appendChild(label);
            }
            else
            {
                if (type == "string") str = '"' + str + '"';
                li.appendChild(document.createTextNode(str));
            }
        }
        catch (e)
        {
            li.appendChild(document.createTextNode("<inaccessible>"));
        }
        
        return li
    }
    
    this.formatElement = function(element)
    {
        return document.createTextNode("<" + element.tagName +
            (element.id ? "#" + element.id : "") +
            (element.className && element.className.split ?
                "." + element.className.split(" ").join(" .") :
                "") +
            ">");
    }
    
  
    this.printLi = function(li)
    {
        var timestamp = document.createElement("div");
        timestamp.classList.add("timestamp"),
		spacer = document.createElement("li");
		
        spacer.textContent = '------------------------------ break ------------------------------';
        spacer.classList.add("spacer");
        
        var date = new Date();
        var hours = ("0" + date.getHours()).substr(-2),
            minutes = ("0" + date.getMinutes()).substr(-2),
            seconds = ("0" + date.getSeconds()).substr(-2),
            milliseconds = ("00" + date.getMilliseconds()).substr(-3);
        timestamp.textContent = hours + ":" + minutes + ":" + seconds + " " + milliseconds + "ms";
        
        li.appendChild(timestamp);
        
        var scroll = true; // 5 pixel margin of error
        elem.output.appendChild(li);
		elem.output.appendChild(spacer);
        if (scroll) elem.console.scrollTop = elem.console.scrollTopMax;
    }
	
	var _getType = function(ob)
    {
        var type = typeof ob;
        
        if (Array.isArray(ob)) type = "array";
        else if ((ob instanceof HTMLElement || ob instanceof XULElement) && ob.tagName) type = "element";
        else if (ob instanceof Error) type = "exception";
        else if (ob === null) type = 'null';
        else if (typeof ob == "object")
        {
            if (ob.constructor && ob.constructor.name)
                type = ob.constructor.name;
            else
                type = Object.prototype.toString.call(ob).slice(8, -1);
        }
        
        return type.toLowerCase();
    }
	
	var _ucFirst = function(str)
    {
        str = str.toString();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    var _obProperties = function(ob, full = true)
    {
        var keys = Object.getOwnPropertyNames(ob);
        
        var k
        for (k in ob) 
            keys.push(k);
        
        if ( ! full)
        {
            keys.push("constructor");
            keys.push("prototype");
        }
        else
        {
            keys = keys.concat(keys, Object.getOwnPropertyNames(ob.constructor));
            keys = keys.concat(keys, Object.getOwnPropertyNames(Object.prototype));
        }
        
        keys = keys.concat(keys, Object.getOwnPropertyNames(Object));
            
        var _keys = [];
        var _processed = {};
        
        var k;
        for (k of keys)
        {
            if (k in _processed) continue;
            
            _processed[k] = true;
            _keys.push(k);
        }
        
        return _keys;
    }
    
    var _keysSorted = function(ob, full = true)
    {
        if (Array.isArray(ob))
            return Object.getOwnPropertyNames(ob).sort(function(a,b){return a - b});
        else
        {
            var keys = _obProperties(ob, full);
            return keys.sort();
        }
    }
    
    var _ellipsis = function (str, length = 50)
    {
        if (str.length <= length && ! str.match(/\n/))
            return str;
        
        str = str.replace(/\n/g, " ");
        if (str.length > length)
        {
            str = str.substr(0,length);
            str += " .."
        }
        
        return str;
    }
    
}).apply(window.app);
