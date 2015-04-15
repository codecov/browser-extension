var storage_get = function(key, cb){
  cb(localStorage.getItem(key));
};
var storage_set = function(key, value, cb){
  localStorage.setItem(key, value);
  cb();
};
self.port.on("preferences", function(prefs){
  codecov(prefs, function(cc){
    $(document).on('pjax:success', function(){
      cc.log('pjax event received');
      cc.get_coverage();
    });
  });
});
