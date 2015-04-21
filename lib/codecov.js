

window.codecov = function(prefs) {
  if ($('meta[content=GitHub]').length > 0) {
    return new Github(prefs);
  }
};

var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.Github = (function() {
  Github.prototype.slug = null;

  Github.prototype.ref = null;

  Github.prototype.base = '';

  Github.prototype.file = '';

  Github.prototype.page = null;

  Github.prototype.found = false;

  Github.prototype.urlid = 0;

  Github.prototype.cache = [null, null];

  Github.prototype.settings = {
    urls: [],
    first_view: 'im',
    debug: false,
    callback: null,
    debug_url: null
  };

  Github.prototype.log = function(title, data) {
    if (this.settings.debug) {
      return console.log(this, title, data);
    }
  };

  function Github(prefs, cb) {

    /*
    Called once at start of extension
     */
    var self;
    self = this;
    self.settings = $.extend(self.settings, prefs);
    self.settings.urls.unshift('https://codecov.io');
    if (typeof cb === "function") {
      cb(this);
    }
    self.get_coverage();
  }

  Github.prototype.get_coverage = function() {

    /*
    CALLED: when dom changes and page first loads
    GOAL: is to collect page variables, insert dom elements, bind callbacks
     */
    var href, ref, ref1, self, split;
    this.log('::get_coverage');
    self = this;
    href = (self.settings.debug_url || document.URL).split('/');
    self.slug = href[3] + "/" + href[4];
    self.page = href[5];
    if ((ref = self.page) === 'releases' || ref === 'tags') {
      return;
    } else if (self.page === 'commit') {
      self.ref = href[6];
    } else if ((ref1 = self.page) === 'blob' || ref1 === 'blame') {
      split = $('a[data-hotkey=y]').attr('href').split('/');
      self.ref = split[4];
      self.file = "/" + (split.slice(5).join('/'));
    } else if (self.page === 'compare') {
      self.base = "&base=" + ($('.commit-id:first').text());
      self.ref = $('.commit-id:last').text();
    } else if (self.page === 'pull') {
      self.base = "&base=" + ($('.commit-id:first').text());
      self.ref = $('.commit-id:last').text();
    } else if (self.page === 'tree') {
      self.ref = $('.file-wrap a.js-directory-link:first').attr('href').split('/')[4];
    } else {
      return;
    }
    $('.repository-content .file').each(function() {
      var file;
      file = $(this);
      if (file.find('.btn.codecov').length === 0) {
        if (file.find('.file-actions > .btn-group').length === 0) {
          file.find('.file-actions a:first').wrap('<div class="btn-group"></div>');
        }
        return file.find('.file-actions > .btn-group').prepend('<a class="btn btn-sm codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io" data-hotkey="c">Coverage loading...</a>');
      }
    });
    return this.run_coverage();
  };

  Github.prototype.run_coverage = function() {

    /*
    CALLED: when coverage should be retrieved.
    GOAL: get coverage from cache -> storage -> URL
     */
    var self, slugref;
    if (this._processing) {
      return;
    }
    this.log('::run_coverage');
    self = this;
    slugref = self.slug + "/" + self.ref;
    this._processing = true;
    if (this.cache[0] === slugref) {
      self.log('process(cache)');
      return this.process(this.cache[1]);
    } else {
      return storage_get(slugref, function(res) {
        if (res != null ? res[self.ref] : void 0) {
          self.log('process(storage)', res[self.ref]);
          return self.process(res[self.ref]);
        } else {
          return self.get(self.settings.urls[self.urlid]);
        }
      });
    }
  };

  Github.prototype.get = function(endpoint) {

    /*
    CALLED: to get the coverage report from Codecov (or Enterprise urls)
    GOAL: http fetch coverage
     */
    var self;
    this.log('::get', endpoint);
    self = this;
    return $.ajax({
      url: endpoint + "/github/" + self.slug + "?ref=" + self.ref + self.base,
      type: 'get',
      dataType: 'json',
      headers: {
        Accept: 'application/json'
      },
      success: function(res) {
        self.url = endpoint;
        self.found = true;
        return self.process(res, true);
      },
      complete: function() {
        var ref;
        self.log('::ajax.complete', arguments);
        return (ref = self.settings) != null ? typeof ref.callback === "function" ? ref.callback() : void 0 : void 0;
      },
      error: function() {
        if (self.settings.urls.length > self.urlid + 1) {
          return self.get(self.settings.urls[self.urlid += 1]);
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
        402: function() {
          if (!self.found) {
            $('.btn.codecov').text("Umbrella required").addClass('danger').attr('aria-label', 'Umbrella account require to view private repo reports').click(function() {
              return window.location = "https://codecov.io/umbrella";
            });
            return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Umbrella required').attr('aria-label', 'Umbrella account require to view private repo reports').click(function() {
              return window.location = "https://codecov.io/umbrella";
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

  Github.prototype.process = function(res, store) {
    var compare, coverage, plus, ref, self, slugref;
    if (store == null) {
      store = false;
    }

    /*
    CALLED: to process report data
    GOAL: to update the dom with coverage
     */
    this._processing = false;
    this.log('::process');
    self = this;
    slugref = self.slug + "/" + self.ref;
    self.cache = [slugref, res];
    if (store && self.cacheable) {
      storage_set({
        slugref: res
      }, function() {
        return null;
      });
    }
    if (self.page === 'tree') {
      $('.commit-meta').prepend("<a href=\"" + self.settings.urls[self.urlid] + "/github/" + self.slug + "?ref=" + self.ref + "\" class=\"sha-block codecov tooltipped tooltipped-n\" aria-label=\"Overall coverage\">" + (Math.floor(res['report']['coverage'])) + "%</a>");
      return $('.file-wrap tr:not(.warning):not(.up-tree)').each(function() {
        var coverage, filepath, ref, ref1, ref2;
        filepath = (ref = $('td.content a', this).attr('href')) != null ? ref.split('/').slice(5).join('/') : void 0;
        if (filepath) {
          coverage = (ref1 = res['report']['files']) != null ? (ref2 = ref1[filepath]) != null ? ref2.coverage : void 0 : void 0;
          if (coverage >= 0) {
            return $('td:last', this).append("<span class=\"sha codecov tooltipped tooltipped-n\" aria-label=\"Coverage\">" + (Math.floor(coverage)) + "%</span>");
          }
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
      return $('.repository-content .file').each(function() {
        var _, _td, button, file, i, len, ref1, ref2, ref3, results;
        file = $(this);
        coverage = res['report']['files'][self.file || file.find('.file-info>span[title]').attr('title')];
        if (file.find('.file-actions > .btn-group').length === 0) {
          file.find('.file-actions a:first').wrap('<div class="btn-group"></div>');
        }
        if (coverage) {
          button = file.find('.btn.codecov').attr('aria-label', 'Toggle Codecov (c)').text('Coverage ' + coverage['coverage'].toFixed(0) + '%').removeClass('disabled').unbind().click((ref1 = self.page) === 'blob' || ref1 === 'blame' ? self.toggle_coverage : self.toggle_diff);
          _td = "td:eq(" + (self.page === 'blob' ? 0 : 1) + ")";
          file.find('tr').each(function() {
            var cov, ref2, td;
            td = $(this).find(_td);
            cov = self.color(coverage['lines'][td.attr('data-line-number') || ((ref2 = td.attr('id')) != null ? ref2.slice(1) : void 0)]);
            return $(this).find('td').addClass("codecov codecov-" + cov);
          });
          if ((ref2 = self.page) === 'blob' || ref2 === 'blame') {
            ref3 = self.settings.first_view;
            results = [];
            for (i = 0, len = ref3.length; i < len; i++) {
              _ = ref3[i];
              results.push(button.trigger('click'));
            }
            return results;
          }
        } else {
          return file.find('.btn.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered');
        }
      });
    }
  };

  Github.prototype.toggle_coverage = function() {

    /*
    CALLED: by user interaction
    GOAL: toggle coverage overlay on blobs/commits/blames/etc.
     */
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

  Github.prototype.toggle_diff = function() {

    /*
    CALLED: by user interaction
    GOAL: toggle coverage overlay on diff/compare
     */
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

  Github.prototype.color = function(ln) {
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

  return Github;

})();


