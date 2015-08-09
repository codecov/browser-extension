var storage_get = function(key, cb){
  chrome.storage.local.get(key, function(data){
    cb(data[key]);
  });
};
var storage_set = chrome.storage.local.set;

$(function(){
  // start codecov
  chrome.storage.sync.get({"first_view": 'im', "enterprise": '', "debug": false}, function(prefs){
    codecov_detect_location(prefs);
  });

});
