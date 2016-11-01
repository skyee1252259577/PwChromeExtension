var host = "https://%HOST%/";
var accounts;
var data;
var secretkey;
var default_letter_used;
var default_length;
var salt1;
var salt2;
var confkey;
var username;

var activeAccountIndex;
var activeAccountUrl;

var lastAction; //ToDo
const inactiveTimeout = 10 * 60 * 1000;

function timeOut() {
    if (lastAction==null) {
        setTimeout(timeOut, inactiveTimeout);
        return;
    }
    if ((lastAction + inactiveTimeout) <= Date.now()){
        cleanup();
        setTimeout(timeOut, inactiveTimeout);
        return;
    }
    setTimeout(timeOut, lastAction + inactiveTimeout - Date.now());
}

function doneAction() {
    lastAction = Date.now();
}

function getAccounts(session_token) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            readData(JSON.parse(this.responseText));
        }
    };
    xhttp.open("POST", host + "password_ajax.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=UTF-8");
    xhttp.send("session_token="+session_token);
}

function readData(data0) {
    console.log("Received Data");
    doneAction();
    data = data0;
    default_letter_used = data["default_letter_used"];
    default_length = data["default_length"];
    salt1 = data["global_salt_1"];
    salt2 = data["global_salt_2"];
    accounts = null;
    //Read Accounts if available
    if (secretkey != "")
        readPasswords();
}

function readPasswords()
{
    accounts = [];
    accountArray = data["accounts"];
    for (var i = 0; i < accountArray.length; i++) {
        var account = accountArray[i];
        var index = account["index"];
        var other = JSON.parse(decryptchar(String(account["additional"]),secretkey));
        accounts[index]  = { "index":index, "name":decryptchar(account["name"], secretkey), "url":other["url"], "username":other["user"], "enpassword": account["kss"]};
    }
    console.log("Decrypted Accounts");
}

function receiveUserSession(session) {
    doneAction();
    console.log("Received session");
    secretkeyNew = session["secretkey"];
    //var secretkey0=getpwdstore(salt2);
    if (secretkeyNew != ""){
        secretkey = secretkeyNew;
        confkey = session["confkey"];
        username = session["username"];
        getAccounts(session["session_token"]);
        doneAction();
        return;
    }
    secretkey = "";
}

function cleanup(){
    for (item in accounts){
        for (value in accounts[item])
            accounts[item][value] = null;
    }
    accounts.length = 0;
    accounts = null;
    data = null;
    secretkey = null;
    default_letter_used = null;
    default_length = null;
	salt1 = null;
	salt2 = null;
	confkey = null;
	username = null;
    lastAction = null;
    console.log("Logged out");
}

function isLoggedIn() {
    doneAction();
    return (secretkey != "") && (secretkey != null) && (accounts!= null);
}

function getUsername() {
    doneAction();
    return username;
}

function getPassword(account) {
    doneAction();
    var key = decryptchar(account["enpassword"], secretkey);
    var conf = decryptchar(confkey,salt2);
    var sha512 = String(CryptoJS.SHA512(account["name"]));
    return get_orig_pwd(conf, salt2, sha512, default_letter_used, key);
}

function getAccountForDomain(domain) {
    doneAction();
    if (activeAccountIndex != null) {
        if (activeAccountIndex in accounts) {
            if (domain.indexOf(activeAccountUrl) >= 0)
                return accounts[activeAccountIndex];
        }
        activeAccountIndex = null;
        activeAccountUrl = null;
    }
    for (var item in accounts) {
        if (accounts[item]["url"].length<5)
            continue;
        if (domain.indexOf(accounts[item]["url"]) >=0)
            return accounts[item];
    }
    return null;
}

function getAccountsForDomain(domain) {
    doneAction();
    var result = [];
    var markedActive = false;
    var bestFitIndex = -1;
    var bestFitLength = 0;
    for (var item in accounts) {
        var url = accounts[item]["url"];
        if (url.length < 5)
            continue;
        if (domain.indexOf(url) >= 0) {
            var account = accounts[item];
            account["active"] = item == activeAccountIndex;
            markedActive = account["active"] || markedActive;
            if (url.length > bestFitLength) {
                bestFitLength = url.length;
                bestFitIndex = result.length;
            }
            result.push(account);
        }
    }
    if (!markedActive) {
        result[bestFitIndex]["active"] = true;
    }
    return result;
}

function setActiveAccount(index, url) {
    activeAccountIndex = index;
    activeAccountUrl = url;
}

timeOut();