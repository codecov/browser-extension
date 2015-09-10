var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.Codecov = (function() {
  Codecov.prototype.slug = null;

  Codecov.prototype.ref = null;

  Codecov.prototype.base = '';

  Codecov.prototype.file = '';

  Codecov.prototype.page = null;

  Codecov.prototype.found = false;

  Codecov.prototype.urlid = 0;

  Codecov.prototype.cache = [null, null];

  Codecov.prototype.settings = {
    urls: [],
    first_view: 'im',
    debug: false,
    callback: null,
    debug_url: null
  };

  Codecov.prototype.log = function(title, data) {
    if (this.settings.debug) {
      return console.log(this, title, data);
    }
  };

  function Codecov(prefs, cb) {

    /*
    Called once at start of extension
     */
    this.settings = $.extend(this.settings, prefs);
    if (!this.settings.urls) {
      this.settings.urls = [];
    }
    this.settings.urls.unshift('https://codecov.io');
    if (typeof cb === "function") {
      cb(this);
    }
    this._start();
  }

  Codecov.prototype.get_ref = function() {};

  Codecov.prototype.prepare = function() {};

  Codecov.prototype.overlay = function() {};

  Codecov.prototype._start = function() {

    /*
    CALLED: when dom changes and page first loads
    GOAL: is to collect page variables, insert dom elements, bind callbacks
     */
    var href;
    this.log('::start');
    href = (this.settings.debug_url || document.URL).split('/');
    this.slug = href[3] + "/" + href[4];
    this.page = href[5];
    this.ref = this.get_ref(href);
    this.log('::ref', this.ref);
    if (this.ref) {
      this.prepare();
      return this._run();
    }
  };

  Codecov.prototype._run = function() {

    /*
    CALLED: when coverage should be retrieved.
    GOAL: get coverage from cache -> storage -> URL
     */
    var self, slugref;
    if (this._processing) {
      return;
    }
    this.log('::run');
    self = this;
    slugref = self.slug + "/" + self.ref;
    this._processing = true;
    if (this.cache[0] === slugref) {
      self.log('process(cache)');
      return this._process(this.cache[1]);
    } else {
      return storage_get(slugref, function(res) {
        if (res != null ? res[self.ref] : void 0) {
          self.log('process(storage)', res[self.ref]);
          return self._process(res[self.ref]);
        } else {
          return self._get(self.settings.urls[self.urlid]);
        }
      });
    }
  };

  Codecov.prototype._get = function(endpoint) {

    /*
    CALLED: to get the coverage report from Codecov (or Enterprise urls)
    GOAL: http fetch coverage
     */
    var self;
    this.log('::get', endpoint);
    self = this;
    return $.ajax({
      url: endpoint + "/api/" + this.service + "/" + this.slug + "?ref=" + this.ref + this.base,
      type: 'get',
      dataType: 'json',
      success: function(res) {
        self.url = endpoint;
        self.found = true;
        return self._process(res, true);
      },
      complete: function() {
        var ref;
        self.log('::ajax.complete', arguments);
        return (ref = self.settings) != null ? typeof ref.callback === "function" ? ref.callback() : void 0 : void 0;
      },
      error: function(xhr, type, reason) {
        self._processing = false;
        self.log(arguments);
        self.error(xhr.status, reason);
        if (self.settings.urls.length > self.urlid + 1) {
          return self._get(self.settings.urls[self.urlid += 1]);
        }
      }
    });
  };

  Codecov.prototype._process = function(res, store) {
    var error, slugref;
    if (store == null) {
      store = false;
    }

    /*
    CALLED: to process report data
    GOAL: to update the dom with coverage
     */
    this._processing = false;
    this.log('::process', res);
    slugref = this.slug + "/" + this.ref;
    this.cache = [slugref, res];
    if (store && this.cacheable) {
      storage_set({
        slugref: res
      }, function() {
        return null;
      });
    }
    try {
      return this.overlay(res);
    } catch (_error) {
      error = _error;
      this.log(error);
      return this.error(500, error);
    }
  };

  Codecov.prototype.find_best_fit_path = function(fp, files) {
    var matches, path;
    matches = [
      (function() {
        var results;
        results = [];
        for (path in files) {
          if (path.slice(fp.length * -1) === fp || fp.slice(path.length * -1) === path) {
            results.push(path);
          }
        }
        return results;
      })()
    ];
    if (matches.length > 0) {
      return files[Math.max(matches)];
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
    } else if (ln instanceof Array) {
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

window.create_codecov_instance = function(prefs, cb) {
  var ref, ref1, url;
  if ((ref = document.getElementById('chrome-install-plugin')) != null) {
    ref.style.display = 'none';
  }
  if ((ref1 = document.getElementById('opera-install-plugin')) != null) {
    ref1.style.display = 'none';
  }
  url = prefs.debug_url || document.URL;
  if (url.indexOf('https://github.com') === 0) {
    return new Github(prefs, cb);
  } else if (url.indexOf('https://bitbucket.org') === 0) {
    return new Bitbucket(prefs, cb);
  } else if (url.indexOf('https://gitlab.com') === 0) {
    return new Bitbucket(prefs, cb);
  }
};

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

window.Github = (function(superClass) {
  extend(Github, superClass);

  function Github() {
    return Github.__super__.constructor.apply(this, arguments);
  }

  Github.prototype.get_ref = function(href) {
    var ref, ref1, split;
    this.service = 'github';
    this.file = null;
    if ((ref = this.page) === 'releases' || ref === 'tags') {
      return false;
    } else if (this.page === 'commit') {
      return href[6];
    } else if ((ref1 = this.page) === 'blob' || ref1 === 'blame') {
      split = $('a[data-hotkey=y]').attr('href').split('/');
      this.file = "" + (split.slice(5).join('/'));
      return split[4];
    } else if (this.page === 'compare') {
      this.base = "&base=" + ($('.commit-id:first').text());
      return $('.commit-id:last').text();
    } else if (this.page === 'pull') {
      this.base = "&base=" + ($('.commit-id:first').text());
      return $('.commit-id:last').text();
    } else if (this.page === 'tree') {
      return $('.js-permalink-shortcut').attr('href').split('/')[4];
    } else {
      return false;
    }
  };

  Github.prototype.prepare = function() {
    this.log('::prepare');
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
    return true;
  };

  Github.prototype.overlay = function(res) {
    var compare, coverage, plus, ref, replacement, self;
    this.log('::overlay');
    self = this;
    $('.codecov-removable').remove();
    if (this.page === 'tree') {
      replacement = "/" + self.slug + "/blob/" + ($('.file-navigation .repo-root a:first').attr('data-branch')) + "/";
      $('.commit-meta').prepend("<a href=\"" + this.settings.urls[this.urlid] + "/github/" + this.slug + "?ref=" + this.ref + "\" class=\"sha-block codecov codecov-removable tooltipped tooltipped-n\" aria-label=\"Overall coverage\">" + (res['report']['coverage'].toFixed(2)) + "%</a>");
      return $('.file-wrap tr:not(.warning):not(.up-tree)').each(function() {
        var coverage, filepath, ref, ref1, ref2;
        filepath = (ref = $('td.content a', this).attr('href')) != null ? ref.replace(replacement, '') : void 0;
        if (filepath) {
          coverage = (ref1 = res['report']['files']) != null ? (ref2 = ref1[filepath]) != null ? ref2.coverage : void 0 : void 0;
          if (!(coverage != null ? coverage.ignored : void 0)) {
            if (coverage >= 0) {
              return $('td:last', this).append("<span class=\"sha codecov codecov-removable tooltipped tooltipped-n\" aria-label=\"Coverage\">" + (coverage.toFixed(2)) + "%</span>");
            }
          }
        }
      });
    } else {
      if ((ref = this.page) === 'commit' || ref === 'compare' || ref === 'pull') {
        if (res['base']) {
          compare = (res['report']['coverage'] - res['base']).toFixed(2);
          plus = compare > 0 ? '+' : '-';
          $('.toc-diff-stats').append(compare === '0.00' ? '<span class="codecov codecov-removable">Coverage did not change.</span>' : "<span class=\"codecov codecov-removable\"> Coverage changed <strong>" + plus + compare + "%</strong></span>");
          $('#diffstat').append("<span class=\"codecov codecov-removable text-diff-" + (compare > 0 ? 'added' : 'deleted') + " tooltipped tooltipped-s\" aria-label=\"Coverage " + (compare > 0 ? 'increased' : 'decreased') + " " + plus + compare + "%\">" + plus + compare + "%</span>");
        } else {
          coverage = res['report']['coverage'].toFixed(2);
          if (!(coverage != null ? coverage.ignored : void 0)) {
            $('.toc-diff-stats').append("<span class=\"codecov codecov-removable\"> Coverage <strong>" + coverage + "%</strong></span>");
            $('#diffstat').append("<span class=\"codecov codecov-removable tooltipped tooltipped-s\" aria-label=\"Coverage\">" + coverage + "%</span>");
          }
        }
      }
      $('#toc li').each(function() {
        var cov;
        coverage = res.report.files[$('a', this).text()];
        if (!(coverage != null ? coverage.ignored : void 0)) {
          cov = coverage != null ? coverage.coverage : void 0;
          if (cov >= 0) {
            return $('.diffstat.right', this).prepend("<span class=\"codecov codecov-removable\">" + (Math.round(cov)) + "%</span>");
          }
        }
      });
      self = this;
      return $('.repository-content .file').each(function() {
        var _, _td, button, file, fp, i, len, ref1, ref2, ref3, results;
        file = $(this);
        fp = self.file || file.find('.file-info>span[title]').attr('title');
        coverage = res['report']['files'][fp] || self.find_best_fit_path(fp, res['report']['files']);
        if (!(coverage != null ? coverage.ignored : void 0)) {
          if (file.find('.file-actions > .btn-group').length === 0) {
            file.find('.file-actions a:first').wrap('<div class="btn-group"></div>');
          }
          if (coverage) {
            button = file.find('.btn.codecov').attr('aria-label', 'Toggle Codecov (c)').text('Coverage ' + coverage['coverage'].toFixed(2) + '%').removeClass('disabled').unbind().click((ref1 = self.page) === 'blob' || ref1 === 'blame' ? self.toggle_coverage : self.toggle_diff);
            _td = "td:eq(" + (self.page === 'blob' ? 0 : 1) + ")";
            file.find('tr').each(function() {
              var cov, ref2, td;
              td = $(this).find(_td);
              cov = self.color(coverage['lines'][td.attr('data-line-number') || ((ref2 = td.attr('id')) != null ? ref2.slice(1) : void 0)]);
              return $(this).find('td').removeClass('codecov-hit codecov-missed codecov-partial').addClass("codecov codecov-" + cov);
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

  Github.prototype.error = function(status, reason) {
    if (status === 401) {
      $('.btn.codecov').text("Please login at Codecov").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
        return window.location = "https://codecov.io/login/github?redirect=" + (escape(window.location.href));
      });
      return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Please login at Codecov.io').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
        return window.location = "https://codecov.io/login/github?redirect=" + (escape(window.location.href));
      });
    } else if (status === 404) {
      $('.btn.codecov').text("No coverage").attr('aria-label', 'Coverage not found');
      return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('No coverage').attr('aria-label', 'Coverage not found');
    } else {
      $('.btn.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry');
      return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('aria-label', 'There was an error loading coverage. Sorry');
    }
  };

  return Github;

})(Codecov);

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

window.Bitbucket = (function(superClass) {
  extend(Bitbucket, superClass);

  function Bitbucket() {
    return Bitbucket.__super__.constructor.apply(this, arguments);
  }

  Bitbucket.prototype.get_ref = function(href) {
    var ref, ref1;
    this.log('::get_ref');
    this.service = 'bitbucket';
    if (this.page === 'src') {
      return href[6].split('?')[0];
    } else if (this.page === 'commits') {
      return href[6].split('?')[0];
    } else if ((ref = this.page) === 'pull-request' || ref === 'pull-requests') {
      return (ref1 = $('.view-file:first').attr('href')) != null ? ref1.split('/')[4] : void 0;
    }
    return false;
  };

  Bitbucket.prototype.prepare = function() {
    this.log('::prepare');
    $('#editor-container, section.bb-udiff').each(function() {
      if ($('.aui-button.codecov', this).length === 0) {
        return $('.secondary>.aui-buttons:first', this).prepend('<a href="#" class="aui-button aui-button-light codecov" title="Requesting coverage from Codecov.io">Coverage loading...</a>');
      }
    });
    return true;
  };

  Bitbucket.prototype.overlay = function(res) {
    var self;
    this.log('::overlay');
    self = this;
    $('.codecov.codecov-removable').remove();
    $('#source-list tr td.dirname').attr('colspan', 5);
    $('#source-list tr').each(function() {
      var cov, coverage, fn, ref;
      fn = (ref = $('a', this).attr('href')) != null ? ref.split('?')[0].split('/').slice(5).join('/') : void 0;
      coverage = res.report.files[fn];
      if (!(coverage != null ? coverage.ignored : void 0)) {
        cov = coverage != null ? coverage.coverage : void 0;
        return $('td.size', this).after('<td title="Coverage" class="codecov codecov-removable">' + (cov >= 0 ? (cov.toFixed(2)) + "%" : '') + "</td>");
      }
    });
    $('section.bb-udiff').each(function() {
      var button, coverage, file, fp;
      file = $(this);
      fp = file.attr('data-path');
      coverage = res['report']['files'][fp] || self.find_best_fit_path(fp, res['report']['files']);
      if (!(coverage != null ? coverage.ignored : void 0)) {
        if (coverage) {
          button = $('.aui-button.codecov', this).attr('title', 'Toggle Codecov').text('Coverage ' + coverage['coverage'].toFixed(2) + '%').unbind().click(self.toggle_diff);
          return $('.udiff-line.common, .udiff-line.addition', this).find('a.line-numbers').each(function() {
            var a, cov, ln, ref;
            a = $(this);
            ln = a.attr('data-tnum');
            cov = (ref = coverage.lines) != null ? ref[ln] : void 0;
            if (cov != null) {
              return a.addClass("codecov codecov-" + (self.color(coverage['lines'][ln])));
            }
          });
        } else {
          return file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered');
        }
      }
    });
    return $("#editor-container").each(function() {
      var _, button, cov, coverage, file, filename, fp, i, len, ln, ref, ref1, ref2, results;
      file = $(this);
      fp = file.attr('data-path');
      coverage = res['report']['files'][fp] || self.find_best_fit_path(fp, res['report']['files']);
      filename = fp.split('/').pop();
      if (!(coverage != null ? coverage.ignored : void 0)) {
        if (coverage) {
          button = file.find('.aui-button.codecov').attr('title', 'Toggle Codecov').text('Coverage ' + coverage['coverage'].toFixed(2) + '%').unbind().click(self.toggle_coverage);
          ref = coverage['lines'];
          for (ln in ref) {
            cov = ref[ln];
            $("a[name='" + filename + "-" + ln + "']", file).addClass("codecov codecov-" + (self.color(cov)));
          }
          if ((ref1 = self.page) === 'src' || ref1 === '') {
            ref2 = self.settings.first_view;
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              _ = ref2[i];
              results.push(button.trigger('click'));
            }
            return results;
          }
        } else {
          return file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered');
        }
      }
    });
  };

  Bitbucket.prototype.toggle_coverage = function(event) {
    event.preventDefault();
    if ($('a.codecov.codecov-hit.codecov-on').length > 0) {
      return $('a.codecov.codecov-hit').removeClass('codecov-on');
    } else if ($('a.codecov.codecov-on').length > 0) {
      $('a.codecov').removeClass('codecov-on');
      return $(this).removeClass('aui-button-light');
    } else {
      $('a.codecov').addClass('codecov-on');
      return $(this).addClass('aui-button-light');
    }
  };

  Bitbucket.prototype.error = function(status, reason) {
    if (status === 401) {
      return $('.aui-button.codecov').text("Please login at Codecov").addClass('aui-button-primary').attr('title', 'Login to view coverage by Codecov').click(function() {
        return window.location = "https://codecov.io/login/github?redirect=" + (escape(window.location.href));
      });
    } else if (status === 404) {
      return $('.aui-button.codecov').text("No coverage").attr('title', 'Coverage not found');
    } else {
      return $('.aui-button.codecov').text("Coverage error").attr('title', 'There was an error loading coverage. Sorry');
    }
  };

  return Bitbucket;

})(Codecov);


