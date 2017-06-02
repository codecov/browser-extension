var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  chrome.storage.sync.get({'overlay': true, 'enterprise': '', 'debug': false, 'hosts': ''}, function(prefs){
    var hosts = (prefs['hosts'] || '').split('\n');
    hosts.push('github.com');
    hosts.push('bitbucket.org');
  
    if (prefs['debug']) {
      console.log('Detecting hostname', window.location.hostname, hosts);
    }
    // detect
    var ref, indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item){ return i; } } return -1; };
    if (ref = window.location.hostname, indexOf.call(hosts, ref) >= 0) {
      if (prefs['overlay'] === undefined) { pref['overlay'] = true; }

      if (prefs['debug']) {
        console.log('Hostname passed. Starting Codecov.');
      }

      // start codecov
      window.codecov = create_codecov_instance(prefs);

      // inject listener
      var s = document.createElement('script');
      s.src = chrome.extension.getURL('lib/listener.js');
      s.onload = function(){this.parentNode.removeChild(this);};
      (document.head||document.documentElement).appendChild(s);
	  // inject styles
	  var style = document.createElement('link');
	  style.rel = 'stylesheet';
	  style.type = 'text/css';
      style.href = chrome.extension.getURL('lib/codecov.css');
	  (document.head||document.documentElement).appendChild(style);

    }
  });
});

window.addEventListener("message", (function(event) {
  if (event.source !== window) { return; }
  if (event.data.type && event.data.type === "codecov") {
    window.codecov.log('::pjax-event-received');
    return window.codecov._start();
  }
}), false);
