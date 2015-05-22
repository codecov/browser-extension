var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  // start codecov
  chrome.storage.sync.get({"first_view": 'im', "enterprise": '', "debug": false}, function(prefs){
    var href = prefs.debug_url || document.URL;
    // detect git service
    // TODO enterprise based on service_urls
    if( href.indexOf('https://github.com') === 0 ){
      window.codecov = new Github(prefs);
    } else if( href.indexOf('https://bitbucket.org') === 0 ){
      window.codecov = new Bitbucket(prefs);
    } else if( href.indexOf('https://gitlab.com') === 0 ){
      window.codecov = new Bitbucket(prefs);
    }
  });

  // inject listener
  var s = document.createElement('script');
  s.src = chrome.extension.getURL('lib/listener.js');
  s.onload = function(){
    this.parentNode.removeChild(this);
  };
  (document.head||document.documentElement).appendChild(s);

  // hide codecov plugin
  var cip = document.getElementById('chrome-install-plugin');
  if (typeof apple !== "undefined" && apple !== null) {
    cip.style.display = 'none';
  }
  var oip = document.getElementById('opera-install-plugin');
  if (typeof apple !== "undefined" && apple !== null) {
    oip.style.display = 'none';
  }
});

window.addEventListener("message", (function(event) {
  if (event.source !== window) {
    return;
  }
  if (event.data.type && event.data.type === "codecov") {
    window.codecov.log('::pjax-event-received');
    return window.codecov._start();
  }
}), false);
