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

var cache = {
  overlay: true,
  enterprise: ''
};

function storage_get(key, cb){
  cb(cache[key]);
}

function storage_set(key, value, cb){
  cache[key] = value;
  cb();
}

function save_coverage(name){
  // my hack to get coverage
  $.ajax({
    "url": "http://localhost:4000/"+name,
    "type": "POST",
    "contentType": 'application/json',
    "data": {"coverage": JSON.stringify(_$jscoverage)}
  });
}
