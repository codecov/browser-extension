var Codecov,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Codecov = {
  settings: {
    show_missed: true,
    show_partial: true,
    url: 'https://codecov.io',
    show_hit: false
  },
  run: function() {
    var files, head, hotkey, method, ref, split, stylesheet;
    files = $('.repository-content .file');
    if (!files) {
      return;
    }
    method = 'file';
    hotkey = $('[data-hotkey=y]');
    if (hotkey.length > 0) {
      split = hotkey.attr('href').split('/');
      if (split[3] === 'blob') {
        ref = split[4];
      }
    }
    if (!ref) {
      ref = $('.commit-id:last').text();
      method = 'compare';
    }
    if (!ref) {
      ref = $('.current-branch:last').text();
      method = 'pull';
    }
    stylesheet = document.createElement('link');
    stylesheet.href = chrome.extension.getURL('dist/github.css');
    stylesheet.rel = 'stylesheet';
    head = document.getElementsByTagName('head')[0] || document.documentElement;
    head.insertBefore(stylesheet, head.lastChild);
    return $.ajax({
      url: Codecov.settings.url + "/github/" + (document.URL.replace(/.*:\/\/github.com\//, '').match(/^[^\/]+\/[^\/]+/)[0]) + "?ref=" + ref,
      method: 'get',
      headers: {
        Accept: 'application/json'
      },
      success: function(res) {
        return files.each(function() {
          var coverage, file;
          file = $(this);
          if (method === 'compare') {
            coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')];
          } else if (method === 'file') {
            coverage = res['report']['files'][file.find('#raw-url').attr('href').split('/').slice(5).join('/')];
          }
          if (file.find('.file-actions > .button-group').length === 0) {
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>');
          }
          if (coverage) {
            file.find('.file-actions > .button-group').prepend($('<a class="minibutton tooltipped tooltipped-n selected" aria-label="Provided by codecov.io">Coverage ' + coverage['coverage'] + '%</a>').click(Codecov.toggle));
            return file.find('tr').each(function() {
              var cov;
              cov = Codecov.coverage(coverage['lines'][$(this).find('td:eq(0)').attr('data-line-number') || $(this).find('td:eq(1)').attr('data-line-number')]);
              return $(this).find('td').addClass("codecov codecov-" + cov);
            });
          } else {
            return file.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported - by bodecov.io">No coverage</a>');
          }
        });
      },
      statusCode: {
        401: function() {},
        404: function() {
          if (method === 'file') {
            return files.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported at codecov.io">No coverage</a>');
          }
        }
      }
    });
  },
  toggle: function() {
    if ($('.codecov.codecov-hit.codecov-on').length > 0) {
      return $('.codecov.codecov-hit').removeClass('codecov-on');
    } else if ($('.codecov.codecov-on').length > 0) {
      $('.codecov').removeClass('codecov-on');
      return $(this).removeClass('selected');
    } else {
      $('.codecov').addClass('codecov-on');
      return $(this).addClass('selected');
    }
  },
  coverage: function(ln) {
    var v;
    if (ln === 0) {
      return "missed" + (Codecov.settings.show_missed ? ' codecov-on' : '');
    } else if (ln === void 0) {
      return null;
    } else if (ln === true) {
      return "partial" + (Codecov.settings.show_partial ? ' codecov-on' : '');
    } else if (indexOf.call(ln.toString(), '/') >= 0) {
      v = ln.split('/');
      if (v[0] === '0') {
        return "missed" + (Codecov.settings.show_missed ? ' codecov-on' : '');
      } else if (v[0] === v[1]) {
        return "hit" + (Codecov.settings.show_hit ? ' codecov-on' : '');
      } else {
        return "partial" + (Codecov.settings.show_partial ? ' codecov-on' : '');
      }
    } else {
      return "hit" + (Codecov.settings.show_hit ? ' codecov-on' : '');
    }
  }
};

$(Codecov.run);
