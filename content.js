var pwAddonHost = false;
chrome.runtime.sendMessage({"request":"host"}, function(response) {
    pwAddonHost = document.location.href.startsWith(response["data"]["url"] + 'password.php');
});
document.addEventListener('secretKeyReady', function(e){
    //send secretKey to Addon
    getActions();
    chrome.runtime.sendMessage({"request":"session", "data":e.detail}, function(response) {
    });
}, false);

document.addEventListener('loggedOut', function(e){
    //log addon out
    chrome.runtime.sendMessage({"request":"logout", "data":{"url": e.detail.url}}, function(response) {
    });
}, false);
document.addEventListener('selectedAccount', function(e){
    if (pwAddonHost) {
        chrome.runtime.sendMessage({"request":"selectAccount", "data":{"index": e.detail.index}}, function(response) {
        });
    }
}, false);

function executeScript(script,args) {
    var payload = '(' + script + ')('+JSON.stringify(args)+');';
var script = document.createElement('script');
script.textContent = payload;
(document.head||document.documentElement).appendChild(script);
script.remove();
}

function getActions() {
    chrome.runtime.sendMessage({"request":"actions"}, function(response) {
        if (!pwAddonHost) {//check if this is really the right url before sending any confidential data
            var evt= new CustomEvent("actionsReceived", null);
            document.dispatchEvent(evt);
            return;
        }
        var request = response;//JSON.parse(response);
        switch(request["request"]){
            case "login":
                //data contains secretkey. It must be set using executeScript
                executeScript(function(data){
                    if (typeof(thisIsThePasswordManager) === 'undefined' || thisIsThePasswordManager === null || thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                        return;
                    console.log('logging in');
                    var salt = data["salt"];
                    setpwdstore(data["sk"],decryptchar(data["confKey"],salt),salt);
                }, {'sk': request["data"]["sk"],'confKey': request["data"]["confKey"], "salt":request["data"]["salt"]});
                break;
            case "logout":
                executeScript(function(data){
                    if (typeof(thisIsThePasswordManager) === 'undefined' || thisIsThePasswordManager === null || thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                        return;
                    quitpwd();
                }, null);
                break;
            case "edit":
                executeScript(function(data){
                    if (typeof(thisIsThePasswordManager) === 'undefined' || thisIsThePasswordManager === null || thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                        return;
                    edit(data["index"]);
                }, {'index': request["data"]});
                break;
            case "addAccount":
                executeScript(function(data){
                    if (typeof(thisIsThePasswordManager) === 'undefined' || thisIsThePasswordManager === null || thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
                        return;
                    $('#add').modal('show');
                    $("#newiteminputurl").val(data["url"]);
                }, {"url":request["data"]["url"]});
                break;
            case "none": break;
        }
        var evt= new CustomEvent("actionsReceived", null);
        document.dispatchEvent(evt);
    });
}
//ToDo: only execute when necessary
getActions();

executeScript(function(){
    if (typeof(thisIsThePasswordManager) === 'undefined' || thisIsThePasswordManager === null || thisIsThePasswordManager != "21688ab4-8e22-43b0-a988-2ca2c98e5796")
        return;
    // We can't be sure this is "our" Password Manager here so the URL get's checked in every "action" instead
    document.addEventListener('actionsReceived', function(e){
            actionsReceived = true;
            if (dataAvailable != false)
                dataReady(dataAvailable);
        });
    var actionsReceived = false;
    var dataAvailable = false;
    var dataReadyOriginal = dataReady; 
    dataReady = function(data) {
        if (!actionsReceived) {
            dataAvailable = data;
            return;
        }
        dataAvailable = false;
        dataReadyOriginal(data);
        var evt= new CustomEvent("secretKeyReady", 
            {'detail':{
                'secretkey': secretkey, 
                'secretkey0': getpwdstore(salt2), 
                'session_token': localStorage.session_token, 
                'confkey': getconfkey(salt2), 
                'username':getcookie('username'), 
                'url':window.location.href }
            });
        document.dispatchEvent(evt);
    };
    // Clear Plugin on Logout 1
    var quitpwdOriginal = quitpwd;
    quitpwd = function(reason) {
        var evt= new CustomEvent("loggedOut", {'detail':{'url':window.location.href}});
        document.dispatchEvent(evt);
        quitpwdOriginal(reason);
    };
    // Clear Plugin on Logout 2
    var quitpwd_untrustOriginal = quitpwd_untrust;
    quitpwd_untrust = function() {
        var evt= new CustomEvent("loggedOut", {'detail':{'url':window.location.href}});
        document.dispatchEvent(evt);
        quitpwd_untrustOriginal();
    };

    // Add a symbol to select an account from the password manager in the addon
    registerPlugin("drawAccount",function(data){
        var account = data["account"];
        var row = data["row"];
        row.find(".namecell .cellOptionButton:last").before($('<a>')
            .attr('title',"Select account for usage with addon")
            .attr('class','cellOptionButton')
            .on('click',{'index':account["index"]}, function(e){
                    var evt = new CustomEvent("selectedAccount", {"detail":{"index":e.data.index}});
                    document.dispatchEvent(evt);
                    showMessage('success', 'This account is now selected in your browser addon.');
                })
            .append($('<span></span>')
                .attr('class','glyphicon glyphicon-share')));
    });
},null);
