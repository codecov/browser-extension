document.addEventListener("pjax:success", function(){
  window.postMessage({type:"codecov"}, "*");
});
