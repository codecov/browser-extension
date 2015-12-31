if (window.jQuery !== undefined &&
    (window.location.hostname === "bitbucket.org" ||
     window.location.hostname === "github.com" ||
     $('meta[property="og:site_name"]').attr('content') == 'GitHub')) {
  $(document).on("pjax:success", function(){
      window.postMessage({type:"codecov"},"*");
  });
}
