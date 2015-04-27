var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  // start codecov
  chrome.storage.sync.get({"first_view": 'im', "enterprise": '', "debug": false}, function(prefs){
    window._codecov = codecov(prefs);
  });

  // inject listener
  var s = document.createElement('script');
  s.src = chrome.extension.getURL('lib/listener.js');
  s.onload = function(){
    this.parentNode.removeChild(this);
  };
  (document.head||document.documentElement).appendChild(s);

  // hide codecov plugin
  document.getElementById('chrome-install-plugin').style.display = 'none';
  document.getElementById('opera-install-plugin').style.display = 'none';
});

window.addEventListener("message", (function(event) {
  if (event.source !== window) {
    return;
  }
  if (event.data.type && event.data.type === "codecov") {
    window._codecov.log('::pjax-event-received');
    return window._codecov.get_coverage();
  }
}), false);
