var Codecov,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Codecov = (function() {
  Codecov.prototype.slug = null;

  Codecov.prototype.ref = null;

  Codecov.prototype.base = '';

  Codecov.prototype.file = '';

  Codecov.prototype.page = null;

  Codecov.prototype.files = null;

  Codecov.prototype.found = false;

  Codecov.prototype.cache = [null, null];

  Codecov.prototype.settings = {
    urls: ['https://codecov.io'],
    first_view: 'im',
    debug: false,
    callback: null
  };

  function Codecov() {
    var ref, script, self;
    self = this;
    this.settings = $.extend(null, this.settings, (ref = typeof window !== "undefined" && window !== null ? window.codecov_settings : void 0) != null ? ref : {});
    chrome.storage.sync.get({
      first_view: 'im',
      enterprise: ''
    }, function(items) {
      self.settings.first_view = items.first_view;
      return $.merge(self.settings.urls, (items.enterprise || "").split("\n").filter(function(a) {
        return a;
      }));
    });
    script = document.createElement('script');
    script.textContent = "$(document).on('pjax:success',function(){window.postMessage({type:\"codecov\"},\"*\");});";
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);
    window.addEventListener("message", (function(event) {
      if (event.source !== window) {
        return;
      }
      if (event.data.type && event.data.type === "codecov") {
        return self.get_coverage();
      }
    }), false);
    self.get_coverage();
  }

  Codecov.prototype.get_coverage = function() {
    var href, ref, self, split;
    self = this;
    href = (self.settings.debug || document.URL).split('/');
    self.slug = href[3] + "/" + href[4];
    self.page = href[5];
    if (self.page === 'find') {
      self.ref = href[6];
    } else if (self.page === 'commit') {
      self.ref = href[6];
    } else if ((ref = self.page) === 'blob' || ref === 'blame') {
      split = $('a[data-hotkey=y]').attr('href').split('/');
      self.ref = split[4];
      self.file = "/" + (split.slice(5).join('/'));
    } else if (self.page === 'compare') {
      self.base = "&base=" + ($('.commit-id:first').text());
      self.ref = $('.commit-id:last').text();
    } else if (self.page === 'pull') {
      self.base = "&base=" + ($('.commit-id:first').text());
      self.ref = $('.commit-id:last').text();
    } else {
      return;
    }
    this.files = $('.repository-content .file');
    this.files.each(function() {
      var file;
      file = $(this);
      if (file.find('.btn.codecov').length === 0) {
        if (file.find('.file-actions > .btn-group').length === 0) {
          file.find('.file-actions a:first').wrap('<div class="btn-group"></div>');
        }
        return file.find('.file-actions > .btn-group').prepend('<a class="btn btn-sm codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io" data-hotkey="c">Coverage loading...</a>');
      }
    });
    $('#tree-finder-results').before("<div class=\"commit commit-tease codecov\">\n  <div class=\"commit-meta\">\n    <span class=\"sha-block\">coverage loading...</span>\n    <div class=\"authorship\">\n      <img alt=\"@codecov\" class=\"avatar\" data-user=\"8226205\" height=\"20\" src=\"https://avatars2.githubusercontent.com/u/8226205?v=3&amp;s=40\" width=\"20\"><span class=\"author-name\"><a href=\"https://codecov.io/github/" + self.slug + "?ref=" + self.ref + "\">Codecov</a></span> coverage results\n    </div>\n  </div>\n</div>");
    $('#tree-finder-field').keyup(function() {
      return setTimeout((function() {
        return self.run_coverage();
      }), 100);
    });
    return this.run_coverage();
  };

  Codecov.prototype.run_coverage = function() {
    var self, slugref;
    if (this._processing) {
      return;
    }
    self = this;
    slugref = self.slug + "/" + self.ref;
    this._processing = true;
    if (this.cache[0] === slugref) {
      return this.process(this.cache[1]);
    } else {
      return chrome.storage.local.get(slugref, function(res) {
        if (res != null ? res[self.ref] : void 0) {
          return self.process(res[self.ref]);
        } else {
          return self.get(self.settings.urls[0]);
        }
      });
    }
  };

  Codecov.prototype.get = function(endpoint) {
    var self;
    self = this;
    return $.ajax({
      url: endpoint + "/github/" + self.slug + self.file + "?ref=" + self.ref + self.base,
      type: 'get',
      dataType: 'json',
      headers: {
        Accept: 'application/json'
      },
      success: function(res) {
        self.found = true;
        return self.process(res, true);
      },
      complete: function() {
        var ref;
        return (ref = self.settings) != null ? typeof ref.callback === "function" ? ref.callback() : void 0 : void 0;
      },
      error: function() {
        if (self.settings.urls.length > 0) {
          return self.get(self.settings.urls[0]);
        }
      },
      statusCode: {
        401: function() {
          if (!self.found) {
            $('.btn.codecov').text("Please login at Codecov.io").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
              return window.location = "https://codecov.io/login/github?redirect=" + (escape(window.location.href));
            });
            return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Please login at Codecov.io').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
              return window.location = "https://codecov.io/login/github?redirect=" + (escape(window.location.href));
            });
          }
        },
        404: function() {
          if (!self.found) {
            $('.btn.codecov').text("No coverage").attr('aria-label', 'Coverage not found');
            return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('No coverage').attr('aria-label', 'Coverage not found');
          }
        },
        500: function() {
          if (!self.found) {
            $('.btn.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry');
            return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('aria-label', 'There was an error loading coverage. Sorry');
          }
        }
      }
    });
  };

  Codecov.prototype.process = function(res, store) {
    var compare, coverage, plus, ref, self, slugref;
    this._processing = false;
    self = this;
    slugref = self.slug + "/" + self.ref;
    self.cache = [slugref, res];
    if (self.page === 'find') {
      $('.commit.codecov .sha-block').html("total coverage <span class=\"sha\">" + (Math.floor(res['report']['coverage'])) + "%</span>");
      $('#tree-finder-results .sha.codecov').remove();
      $('#tree-finder-results tr a').each(function() {
        var coverage, ref;
        coverage = (ref = res['report']['files'][$(this).attr('href').split('/').slice(7).join('/')]) != null ? ref.coverage : void 0;
        if (coverage >= 0) {
          return $(this).after("<span class=\"sha codecov\">" + (Math.floor(coverage)) + "%</span>");
        }
      });
    } else {
      if ((ref = self.page) === 'commit' || ref === 'compare' || ref === 'pull') {
        if (res['base']) {
          compare = (res['report']['coverage'] - res['base']).toFixed(0);
          plus = compare > 0 ? '+' : '-';
          $('.toc-diff-stats').append(compare === '0' ? "Coverage did not change." : " Coverage changed <strong>" + plus + compare + "%</strong>");
          $('#diffstat').append("<span class=\"text-diff-" + (compare > 0 ? 'added' : 'deleted') + " tooltipped tooltipped-s\" aria-label=\"Coverage " + (compare > 0 ? 'increased' : 'decreased') + " " + plus + compare + "%\">" + plus + compare + "%</span>");
        } else {
          coverage = res['report']['coverage'].toFixed(0);
          $('.toc-diff-stats').append(" Coverage <strong>" + coverage + "%</strong>");
          $('#diffstat').append("<span class=\"tooltipped tooltipped-s\" aria-label=\"Coverage " + coverage + "%\">" + coverage + "%</span>");
        }
      }
      $('#toc li').each(function() {
        var cov, ref1;
        cov = (ref1 = res.report.files[$('a', this).text()]) != null ? ref1.coverage : void 0;
        if (cov >= 0) {
          return $('.diffstat.right', this).prepend((Math.round(cov)) + "%");
        }
      });
      self.files.each(function() {
        var _, _td, button, file, i, len, ref1, ref2, ref3, ref4, results;
        file = $(this);
        if ((ref1 = self.page) === 'blob' || ref1 === 'blame') {
          coverage = res['report'];
        } else {
          coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')];
        }
        if (file.find('.file-actions > .btn-group').length === 0) {
          file.find('.file-actions a:first').wrap('<div class="btn-group"></div>');
        }
        if (coverage) {
          button = file.find('.btn.codecov').attr('aria-label', 'Toggle Codecov (c)').text('Coverage ' + coverage['coverage'].toFixed(0) + '%').removeClass('disabled').unbind().click((ref2 = self.page) === 'blob' || ref2 === 'blame' ? self.toggle_coverage : self.toggle_diff);
          _td = "td:eq(" + (self.page === 'blob' ? 0 : 1) + ")";
          file.find('tr').each(function() {
            var cov, ref3, td;
            td = $(this).find(_td);
            cov = self.color(coverage['lines'][td.attr('data-line-number') || ((ref3 = td.attr('id')) != null ? ref3.slice(1) : void 0)]);
            return $(this).find('td').addClass("codecov codecov-" + cov);
          });
          if ((ref3 = self.page) === 'blob' || ref3 === 'blame') {
            ref4 = self.settings.first_view;
            results = [];
            for (i = 0, len = ref4.length; i < len; i++) {
              _ = ref4[i];
              results.push(button.trigger('click'));
            }
            return results;
          }
        } else {
          return file.find('.btn.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered');
        }
      });
    }
    if (store && self.cacheable) {
      return chrome.storage.local.set({
        slugref: res
      }, function() {
        return null;
      });
    }
  };

  Codecov.prototype.toggle_coverage = function() {
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
    if ($(this).hasClass('selected')) {
      $(this).removeClass('selected');
      file.find('.blob-num-deletion').parent().show();
      return file.find('.codecov').removeClass('codecov-on');
    } else {
      $(this).addClass('selected');
      file.find('.blob-num-deletion').parent().hide();
      return file.find('.codecov').addClass('codecov-on');
    }
  };

  Codecov.prototype.color = function(ln) {
    var h, m, v;
    if (ln === 0) {
      return "missed";
    } else if (!ln) {
      return null;
    } else if (ln === true) {
      return "partial";
    } else if (typeof ln === 'list') {
      h = $.grep(ln, function(p) {
        return p[2] > 0;
      }).length > 0;
      m = $.grep(ln, function(p) {
        return p[2] === 0;
      }).length > 0;
      if (h && m) {
        return "partial";
      } else if (h) {
        return "hit";
      } else {
        return "missed";
      }
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
  return window.codecov = new Codecov;
});
