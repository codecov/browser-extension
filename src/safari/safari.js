var storage_get = function(key, cb){
  cb(localStorage.getItem(key));
};
var storage_set = function(key, value, cb){
  localStorage.setItem(key, value);
  cb();
};

codecov(safari.extension.settings);
