$(document).on("pjax:success", function(){
  window.postMessage({type:"codecov"},"*");
});
