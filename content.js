document.addEventListener('secretKeyReady', function(e){
    //send message to ext
    console.log(e.detail);
    chrome.runtime.sendMessage({"request":"session", "data":e.detail}, function(response) {
        //callback
    });
}, false);

document.addEventListener('loggedOut', function(e){
    //send message to ext
    chrome.runtime.sendMessage({"request":"logout"}, function(response) {
        //callback
    });
}, false);

function executeScript(script,args) {
    var payload = '(' + script + ')('+JSON.stringify(args)+');';
    var script = document.createElement('script');
    script.textContent = payload;
    (document.head||document.documentElement).appendChild(script);
    script.remove();
}

console.log(103);
chrome.runtime.sendMessage({"request":"actions"}, function(response) {
    var request = JSON.parse(response);
    switch(request["request"]){
        case "login":
            //data contains secretkey. It must be set using executeScript
            break;
        case "edit":
            break;
        case "addAccount":
            break;
    }
});
console.log(104);

executeScript(function(){
    var dataReadyOriginal = dataReady; 
    dataReady = function(data) {
        console.log("105 - before");
        dataReadyOriginal(data);
        console.log("100 - after");
        var evt= new CustomEvent("secretKeyReady", {'detail':{'secretkey': secretkey, 'session_token': localStorage.session_token, 'confkey': sessionStorage.confusion_key, 'username':getcookie('username') }});
        document.dispatchEvent(evt);
    };
    var quitpwdOriginal = quitpwd;
    quitpwd = function() {
        var evt= new CustomEvent("loggedOut", {});
        document.dispatchEvent(evt);
        quitpwdOriginal();
    }
    var quitpwd_untrustOriginal = quitpwd_untrust;
    quitpwd_untrust = function() {
        var evt= new CustomEvent("loggedOut", {});
        document.dispatchEvent(evt);
        quitpwd_untrustOriginal();
    }
    console.log(101);
},null);
console.log(102);
