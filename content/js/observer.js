window.addEventListener('load', function() {
    window.document.documentElement.classList.add("hud");
    
    var obs = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    var consoleSdk = require("ko/console");
    
    obs.addObserver(
    {
        observe: (aMessage) =>
        {
            aMessage = aMessage.wrappedJSObject;
            
            var len = 0;
            var args = aMessage.arguments;
            var data = args.map(function(arg)
            {
                len++;
                return consoleSdk._stringify(arg, true);
            }).join(" ");
            if (len === 1) data = aMessage.arguments[0];
                
            var type = aMessage.level;
            if (["log", "info", "warn", "error"].indexOf(aMessage.level) == -1)
            {
                type = "log";
                if ((typeof data) == "string")
                    data = aMessage.level + ": " + data;
            }
                
            window.app.print(type, data);
        }
    }, "git-console-log-event", false);
});