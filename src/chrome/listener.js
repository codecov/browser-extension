if ($ == null || $ == undefined) {
  document.addEventListener("pjax:success", function(){
    window.postMessage({type:"codecov"},"*");
  });
} else {
  $(function(){
    $(document).on('pjax:success', function(){
      window.postMessage({type:"codecov"},"*");
    });
  });
}
