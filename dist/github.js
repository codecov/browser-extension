var Codecov,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Codecov = (function() {
  Codecov.prototype.slug = null;

  Codecov.prototype.ref = null;

  Codecov.prototype.method = null;

  Codecov.prototype.files = null;

  Codecov.prototype.settings = {
    url: 'https://codecov.io',
    show_missed: true,
    show_partial: true,
    show_hit: false,
    method: null,
    files: null
  };

  function Codecov() {
    var head, hotkey, split, stylesheet;
    stylesheet = document.createElement('link');
    stylesheet.href = chrome.extension.getURL('dist/github.css');
    stylesheet.rel = 'stylesheet';
    head = document.getElementsByTagName('head')[0] || document.documentElement;
    head.insertBefore(stylesheet, head.lastChild);
    this.slug = document.URL.replace(/.*:\/\/github.com\//, '').match(/^[^\/]+\/[^\/]+/)[0];
    this.method = 'blob';
    hotkey = $('[data-hotkey=y]');
    if (hotkey.length > 0) {
      split = hotkey.attr('href').split('/');
      if (split[3] === 'blob') {
        this.ref = split[4];
      }
    }
    if (!this.ref) {
      this.ref = $('.commit-id:last').text();
      this.method = 'compare';
    }
    if (!this.ref) {
      this.ref = $('.current-branch:last').text();
      this.method = 'pull';
    }
    this.run();
  }

  Codecov.prototype.run = function() {
    var self;
    this.files = $('.repository-content .file');
    if (!this.files) {
      return;
    }
    self = this;
    return $.ajax({
      url: this.settings.url + "/github/" + this.slug + "?ref=" + this.ref,
      method: 'get',
      headers: {
        Accept: 'application/json'
      },
      beforeSend: function() {
        return self.files.each(function() {
          var file;
          file = $(this);
          if (file.find('.file-actions > .button-group').length === 0) {
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>');
          }
          return file.find('.file-actions > .button-group').prepend('<a class="minibutton codecov disabled tooltipped tooltipped-n" aria-label="Coverage loading...">Coverage loading...</a>');
        });
      },
      success: function(res) {
        return self.files.each(function() {
          var button, coverage, file;
          file = $(this);
          if (self.method === 'compare') {
            coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')];
          } else if (self.method === 'blob') {
            coverage = res['report']['files'][file.find('#raw-url').attr('href').split('/').slice(5).join('/')];
          }
          if (file.find('.file-actions > .button-group').length === 0) {
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>');
          }
          if (coverage) {
            button = file.find('.minibutton.codecov').attr('aria-label', 'Toggle Codecov').text('Coverage ' + coverage['coverage'] + '%').removeClass('disabled').unbind().click(self.method === 'blob' ? self.toggle_coverage : self.toggle_diff);
            file.find('tr').each(function() {
              var cov;
              cov = self.color(coverage['lines'][$(this).find("td:eq(" + (self.method === 'blob' ? 0 : 1) + ")").attr('data-line-number')]);
              return $(this).find('td').addClass("codecov codecov-" + cov);
            });
            if (self.method === 'blob') {
              return button.trigger('click');
            }
          } else {
            return file.find('.minibutton.codecov').attr('aria-label', 'Commit not found or file not reported to Codecov').text('No coverage');
          }
        });
      },
      statusCode: {
        401: function() {},
        404: function() {
          if (self.method === 'blob') {
            return self.files.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported at codecov.io">No coverage</a>');
          }
        }
      }
    });
  };

  Codecov.prototype.toggle_coverage = function() {
    console.log(this);
    if ($('.codecov.codecov-hit.codecov-on').length > 0) {
      return $('.codecov.codecov-hit').removeClass('codecov-on');
    } else if ($('.codecov.codecov-on').length > 0) {
      $('.codecov').removeClass('codecov-on');
      return $(this).removeClass('selected');
    } else {
      $('.codecov').addClass('codecov-on');
      return $(this).addClass('selected');
    }
  };

  Codecov.prototype.toggle_diff = function() {
    var file;
    file = $(this).parents('.file');
    if (file.find('.blob-num-deletion:first').parent().is(':visible')) {
      $(this).addClass('selected');
      file.find('.blob-num-deletion').parent().hide();
      return file.find('.codecov').addClass('codecov-on');
    } else {
      $(this).removeClass('selected');
      file.find('.blob-num-deletion').parent().show();
      return file.find('.codecov').removeClass('codecov-on');
    }
  };

  Codecov.prototype.color = function(ln) {
    var v;
    if (ln === 0) {
      return "missed";
    } else if (ln === void 0) {
      return null;
    } else if (ln === true) {
      return "partial";
    } else if (indexOf.call(ln.toString(), '/') >= 0) {
      v = ln.split('/');
      if (v[0] === '0') {
        return "missed";
      } else if (v[0] === v[1]) {
        return "hit";
      } else {
        return "partial";
      }
    } else {
      return "hit";
    }
  };

  return Codecov;

})();

$(function() {
  return new Codecov;
});
