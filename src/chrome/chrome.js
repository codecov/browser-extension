var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  chrome.storage.sync.get({"first_view": 'im', "enterprise": '', "debug": false}, function(prefs){
    codecov(prefs, function(self){
        var script;
        script = document.createElement('script');
        script.textContent = "$(document).on('pjax:success',function(){window.postMessage({type:\"codecov\"},\"*\");});";
        (document.head || document.documentElement).appendChild(script);
        script.parentNode.removeChild(script);
        window.addEventListener("message", (function(event) {
          if (event.source !== window) {
            return;
          }
          if (event.data.type && event.data.type === "codecov") {
            self.log('pjax event received');
            return self.get_coverage();
          }
        }), false);
    });
  });
});
