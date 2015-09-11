var data = require('sdk/self').data,
 pageMod = require('sdk/page-mod'),
   prefs = require('sdk/simple-prefs').prefs,
 domains = ['https://github.com/*', 'https://bitbucket.org/*'];

if (prefs.domains) {
  var d, i;
  var enterprise = prefs.domains.split(',');
  for (i = enterprise.length - 1; i >= 0; i--) {
    d = enterprise[i];
    if (d) {
      domains.push('https://' + d + '/*');
    }
  }
}

pageMod.PageMod({
  include: domains,
  contentScriptFile : [data.url('jquery-2.1.3.min.js'),
                       data.url('codecov.js')],
  contentStyleFile  : [data.url('codecov.css')],
  contentScriptWhen : 'end',
  onAttach: function(worker){
    worker.port.emit('preferences', prefs);
  }
});
