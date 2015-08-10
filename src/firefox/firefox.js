var storage_get = function(key, cb){
  cb(localStorage.getItem(key));
};

var storage_set = function(key, value, cb){
  localStorage.setItem(key, value);
  cb();
};

self.port.on("preferences", function(prefs){
  window.codecov = create_codecov_instance(prefs);
  window.addEventListener("message", function(event){
    // cannot figure out how to attach to pjax:success, but this is a hack
    window.codecov._start();
  }, false);
});
