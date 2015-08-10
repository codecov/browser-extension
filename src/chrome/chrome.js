var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  // start codecov
  chrome.storage.sync.get({"first_view": 'im', "enterprise": '', "debug": false}, function(prefs){
    window.codecov = create_codecov_instance(prefs);
  });

  // inject listener
  var s = document.createElement('script');
  s.src = chrome.extension.getURL('lib/listener.js');
  s.onload = function(){this.parentNode.removeChild(this);};
  (document.head||document.documentElement).appendChild(s);

});

window.addEventListener("message", (function(event) {
  if (event.source !== window) { return; }
  if (event.data.type && event.data.type === "codecov") {
    window.codecov.log('::pjax-event-received');
    return window.codecov._start();
  }
}), false);
