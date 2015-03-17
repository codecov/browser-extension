var click = function (el){
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
      "click",
      true /* bubble */, true /* cancelable */,
      window, null,
      0, 0, 0, 0, /* coordinates */
      false, false, false, false, /* modifier keys */
      0 /*left*/, null
    );
    el.dispatchEvent(ev);
};

var expect = chai.expect;

var chrome = {
  extension: {
    getURL: function(loca){ return "../../"+loca; }
  },
  storage: {
    cache: {
      // defaults
      first_view: 'im',
      enterprise: ''
    },
    sync: {
      get: function(key, callback){
        callback(chrome.storage.cache);
      },
      set: function(cache, callback){
        chrome.storage.cache = cache;
        callback();
      }
    },
    local: {
      get: function(key, callback){
        callback(chrome.storage.cache);
      },
      set: function(cache, callback){
        chrome.storage.cache = cache;
        callback();
      }
    }
  }
};

var mochaRunTests = function(){
  mocha.run();
};
