var data = require('sdk/self').data,
    pageMod = require('sdk/page-mod'),
    prefs = require('sdk/simple-prefs').prefs;

pageMod.PageMod({
  include: ['https://github.com/*',
            'https://bitbucket.com/*',
            'https://gitlab.com/*'
           ],
  contentScriptFile : [data.url('jquery-2.1.3.min.js'),
                       data.url('codecov.js')
                      ],
  contentStyleFile  : [data.url('codecov.css')
                      ],
  contentScriptWhen : 'end',
  onAttach: function(worker){
    worker.port.emit('preferences', prefs);
  }
});
