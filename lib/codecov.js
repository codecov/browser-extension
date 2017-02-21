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

  Codecov.prototype.messages = {
    status: {
      pending: {
        title: 'Requesting coverage from Codecov.io',
        text: 'Coverage loading...'
      },
      not_found: {
        title: 'Coverage not found',
        text: 'No coverage'
      },
      login: {
        title: 'Login to view coverage by Codecov',
        text: 'Please login at Codecov'
      },
      error: {
        title: 'Coverage error',
        text: 'There was an error loading coverage. Sorry'
      }
    }
  };

  Codecov.prototype.colors = ['#f8d9d3', '#f8d9d3', '#f8d9d3', '#f9dad2', '#f9dad2', '#fadad1', '#fadad1', '#fadad1', '#fbdbd0', '#fbdbd0', '#fbdbd0', '#fcdbcf', '#fcdccf', '#fddcce', '#fddcce', '#fdddce', '#feddcd', '#feddcd', '#fedecd', '#ffdecc', '#ffdecc', '#ffdfcc', '#fee0cd', '#fee2cd', '#fee3cd', '#fee4cd', '#fde5ce', '#fde6ce', '#fde7ce', '#fde8ce', '#fce9cf', '#fceacf', '#fcebcf', '#fceccf', '#fbedd0', '#fbeed0', '#fbefd0', '#fbefd0', '#faf0d1', '#faf1d1', '#faf1d1', '#faf2d1', '#faf2d1', '#faf2d1', '#faf3d1', '#f9f3d2', '#f9f4d2', '#f9f4d2', '#f9f4d2', '#f9f5d2', '#f9f5d2', '#f9f5d2', '#f8f6d3', '#f8f6d3', '#f8f6d3', '#f8f7d3', '#f8f7d3', '#f8f7d3', '#f7f8d3', '#f7f7d4', '#f7f7d4', '#f7f8d3', '#f7f8d3', '#f7f9d2', '#f6f9d2', '#f6f9d2', '#f6fad1', '#f6fad1', '#f6fbd0', '#f6fbd0', '#f5fbd0', '#f5fccf', '#f5fccf', '#f4fdce', '#f4fdce', '#f4fdce', '#f3fecd', '#f3fecd', '#f3ffcc', '#f2ffcc', '#f2ffcc', '#f1ffcc', '#f0ffcc', '#eefecd', '#edfecd', '#ecfecd', '#ebfecd', '#e9fecd', '#e8fdce', '#e7fdce', '#e6fdce', '#e5fdce', '#e4fdce', '#e3fccf', '#e2fccf', '#e1fccf', '#e0fccf', '#dffccf', '#defbd0', '#ddfbd0', '#dcfbd0'];

  Codecov.prototype.settings = {
    urls: [],
    overlay: true,
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
    var href, ref, urls;
    this.settings = $.extend(this.settings, prefs);
    urls = [];
    if (prefs.enterprise) {
      urls = prefs.enterprise.split('\n').filter(Boolean);
    }
    href = (this.settings.debug_url || document.URL).split('/');
    if ((ref = href[2]) === 'github.com' || ref === 'bitbucket.org') {
      urls.unshift('https://codecov.io');
    }
    this.settings.urls = urls;
    if (typeof cb === "function") {
      cb(this);
    }
    this._start();
  }

  Codecov.prototype.get_ref = function() {};

  Codecov.prototype.prepare = function() {};

  Codecov.prototype.overlay = function() {};

  Codecov.prototype.get_codecov_yml = function() {};

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
    var self;
    if (this._processing) {
      return;
    }
    this.log('::run');
    self = this;
    this.cachekey = (this.slug + "/" + this.ref) + (this.base ? "/" + this.base : '');
    this._processing = true;
    this.storage_get = storage_get;
    if (this.cache[0] === this.cachekey) {
      self.log('::in-memory');
      return this._process(this.cache[1]);
    } else {
      return storage_get(this.cachekey, function(result) {
        if (result != null) {
          self.log('::in-cached');
          return self._process(result);
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
    var e, self, url;
    this.log('::get', endpoint);
    self = this;
    if (indexOf.call(this.ref, '/') >= 0) {
      url = endpoint + "/api/" + this.service + "/" + this.slug + "/" + this.ref + "&src=extension";
    } else {
      e = this.base ? "compare/" + this.base + "..." + this.ref : "commits/" + this.ref;
      url = endpoint + "/api/" + this.service + "/" + this.slug + "/" + e + "?src=extension";
    }
    return $.ajax({
      url: url,
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
        if ((ref = self.settings) != null) {
          if (typeof ref.callback === "function") {
            ref.callback();
          }
        }
        return self._validate_codecov_yml();
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
    var error, obj, ref, ref1, ref10, ref11, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    if (store == null) {
      store = false;
    }

    /*
    CALLED: to process report data
    GOAL: to update the dom with coverage
     */
    this._processing = false;
    this.log('::process', res);
    this.cache = [this.cachekey, res];
    if (store && this.cacheable) {
      storage_set((
        obj = {},
        obj["" + this.cachekey] = res,
        obj
      ), function() {
        return null;
      });
    }
    this.yaml = {
      round: (((ref = res.repo) != null ? (ref1 = ref.yaml) != null ? (ref2 = ref1.coverage) != null ? ref2.round : void 0 : void 0 : void 0) != null) || 'down',
      precision: ((ref3 = res.repo) != null ? (ref4 = ref3.yaml) != null ? (ref5 = ref4.coverage) != null ? ref5.precision : void 0 : void 0 : void 0) != null ? res.repo.yaml.coverage.precision : 2,
      range: [parseFloat(((ref6 = res.repo) != null ? (ref7 = ref6.yaml) != null ? (ref8 = ref7.coverage) != null ? ref8.range : void 0 : void 0 : void 0) != null ? res.repo.yaml.coverage.range[0] : 70), parseFloat(((ref9 = res.repo) != null ? (ref10 = ref9.yaml) != null ? (ref11 = ref10.coverage) != null ? ref11.range : void 0 : void 0 : void 0) != null ? res.repo.yaml.coverage.range[1] : 100)]
    };
    try {
      return this.overlay(res);
    } catch (_error) {
      error = _error;
      console.debug(error);
      this.log(error);
      return this.error(500, error);
    }
  };

  Codecov.prototype.color = function(ln) {
    var c, v;
    if (ln == null) {
      return;
    }
    c = ln.c == null ? ln : ln.c;
    if (c === 0) {
      return "missed";
    } else if (c === true) {
      return "partial";
    } else if (indexOf.call(c, '/') >= 0) {
      v = c.split('/');
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

  Codecov.prototype.bg = function(coverage) {
    coverage = parseFloat(coverage);
    if (coverage <= this.yaml.range[0]) {
      return this.colors[0];
    } else if (coverage >= this.yaml.range[1]) {
      return this.colors[100];
    } else {
      return this.colors[parseInt(((coverage - this.yaml.range[0]) / (this.yaml.range[1] - this.yaml.range[0])) * 100)];
    }
  };

  Codecov.prototype.ratio = function(x, y) {
    if (x >= y) {
      return "100";
    } else if ((y > x && x > 0)) {
      return this.format(Math.round((x / y) * 10000) / 100);
    } else {
      return "0";
    }
  };

  Codecov.prototype.format = function(cov) {
    var _, c;
    cov = parseFloat(cov);
    if (this.yaml.round === 'up') {
      _ = parseFloat(Math.pow(10, this.yaml.precision));
      c = Math.ceil(cov * _) / _;
    } else if (this.yaml.round === 'down') {
      _ = parseFloat(Math.pow(10, this.yaml.precision));
      c = Math.floor(cov * _) / _;
    } else {
      c = Math.round(cov, this.yaml.precision);
    }
    return cov.toFixed(this.yaml.precision);
  };

  Codecov.prototype._validate_codecov_yml = function() {
    var self, yml;
    self = this;
    yml = self.get_codecov_yml();
    if (yml) {
      return $.ajax({
        url: self.settings.urls[self.urlid] + "/validate",
        type: 'post',
        data: yml,
        success: self.yaml_ok,
        error: function(xhr, type, reason) {
          return self.yml_error(reason);
        }
      });
    }
  };

  return Codecov;

})();

window.create_codecov_instance = function(prefs, cb) {
  var ref, ref1, ref2, ref3;
  if ((ref = document.getElementById('chrome-install-plugin')) != null) {
    ref.style.display = 'none';
  }
  if ((ref1 = document.getElementById('opera-install-plugin')) != null) {
    ref1.style.display = 'none';
  }
  if ($('meta[name="hostname"]').length > 0) {
    return new Github(prefs, cb);
  } else if (((ref2 = $('meta[name="application-name"]').attr('content')) === 'Bitbucket' || ref2 === 'Stash') && $('meta[name="bb-canon-url"]').attr('content') === 'https://bitbucket.org') {
    return new Bitbucket(prefs, cb);
  } else if (((ref3 = $('meta[name="application-name"]').attr('content')) === 'Bitbucket' || ref3 === 'Stash') && $('meta[name="bb-canon-url"]').attr('content') !== 'https://bitbucket.org') {
    return new BitbucketServer(prefs, cb);
  } else if (indexOf.call($('meta[name="description"]').attr('content'), 'GitLab') >= 0) {
    return new Gitlab(prefs, cb);
  }
};

var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.Github = (function(superClass) {
  extend(Github, superClass);

  function Github() {
    return Github.__super__.constructor.apply(this, arguments);
  }

  Github.prototype.get_ref = function(href) {
    var from, ref, ref1, split, to;
    this.service = window.location.hostname === 'github.com' || (this.settings.debug_url != null) ? 'gh' : 'ghe';
    this.file = null;
    if ((ref = this.page) === 'releases' || ref === 'tags') {
      return false;
    } else if (this.page === 'commit') {
      return href[6];
    } else if (this.page === 'commits') {
      to = $('li.commit:first a:last').attr('href').split('/')[4];
      from = $('li.commit:last a:last').attr('href').split('/')[4];
      return "branch/" + (href[6] || $('.branch-select-menu .js-select-button').text()) + "/commits?start=" + from + "&stop=" + to;
    } else if (href[7] === 'commits') {
      this.page = 'commits';
      to = $('li.commit:first a:last').attr('href').split('/')[4];
      from = $('li.commit:last a:last').attr('href').split('/')[4];
      return "pull/" + href[6] + "/commits?start=" + from + "&stop=" + to;
    } else if ((ref1 = this.page) === 'blob' || ref1 === 'blame') {
      split = $('a[data-hotkey=y]').attr('href').split('/');
      this.file = "" + (split.slice(5).join('/'));
      return split[4];
    } else if (this.page === 'compare') {
      this.base = "" + ($('.commit-id:first').text() || $('input[name=comparison_start_oid]').val());
      return $('.commit-id:last').text() || $('input[name=comparison_end_oid]').val();
    } else if (this.page === 'pull') {
      this.base = "" + ($('.commit-id:first').text() || $('input[name=comparison_start_oid]').val());
      return $('.commit-id:last').text() || $('input[name=comparison_end_oid]').val();
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
        if (file.find('.file-actions > .BtnGroup').length === 0) {
          file.find('.file-actions a:first').wrap('<div class="BtnGroup"></div>');
        }
        return file.find('.file-actions > .BtnGroup').prepend("<a class=\"btn BtnGroup-item btn-sm codecov disabled tooltipped tooltipped-n\"\naria-label=\"Requesting coverage from Codecov.io\"\ndata-hotkey=\"c\">Coverage loading...</a>").find('.btn').addClass('BtnGroup-item');
      }
    });
    return true;
  };

  Github.prototype.overlay = function(res) {
    var _td, base_url, c, commits, i, len, ref, ref1, ref2, ref3, ref4, ref5, report, self, split_view, total, total_hits, total_lines;
    this.log('::overlay');
    self = this;
    $('.codecov-removable').remove();
    if (this.page === 'commits') {
      commits = {};
      ref = res.commits;
      for (i = 0, len = ref.length; i < len; i++) {
        c = ref[i];
        commits[c.commitid] = c;
      }
      base_url = self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/commit";
      return $('li.commit').each(function() {
        var $commit, commit, ref1;
        $commit = $(this);
        commit = commits[$commit.find('a:last').attr('href').split('/')[4]];
        console.log($commit.find('a:last').attr('href').split('/')[4], commit);
        if ((commit != null ? (ref1 = commit.totals) != null ? ref1.c : void 0 : void 0) != null) {
          return $commit.find('.commit-meta.commit-author-section').append("<a title=\"Codecov Coverage\" href=\"" + base_url + "/" + commit.commitid + "\">" + (self.format(commit.totals.c)) + "%</Aa>");
        }
      });
    } else {
      report = ((ref1 = res.commit) != null ? ref1.report : void 0) || ((ref2 = res.head) != null ? ref2.report : void 0) || res.report;
      if (this.page === 'tree') {
        total = ((ref3 = report.totals) != null ? ref3.c : void 0) != null ? report.totals.c : report.coverage;
        $('.commit-tease span.right').append("<a href=\"" + this.settings.urls[this.urlid] + "/github/" + this.slug + "?ref=" + this.ref + "\"\n   class=\"sha-block codecov codecov-removable tooltipped tooltipped-n\"\n   aria-label=\"Codecov Coverage\">\n  " + (self.format(total)) + "%\n</a>");
        return $('.file-wrap tr:not(.warning):not(.up-tree)').each(function() {
          var cov, file, filepath, path, ref4, ref5, ref6, ref7;
          filepath = (ref4 = $('td.content a', this).attr('href')) != null ? ref4.split('/').slice(5).join('/') : void 0;
          if (filepath) {
            file = (ref5 = report.files) != null ? ref5[filepath] : void 0;
            if (file != null) {
              if (file != null ? file.ignored : void 0) {
                return;
              }
              cov = ((ref6 = file.t) != null ? ref6.c : void 0) != null ? file.t.c : file.coverage;
              if (cov != null) {
                path = ((ref7 = file.t) != null ? ref7.c : void 0) != null ? "src/" + self.ref + "/" + filepath : filepath + "?ref=" + self.ref;
                return $('td:last', this).after("<td style=\"background:linear-gradient(90deg, " + (self.bg(cov)) + " " + cov + "%, white " + cov + "%);text-align:right;\"\n    class=\"sha codecov codecov-removable tooltipped tooltipped-n\"\n    aria-label=\"Codecov Coverage\">\n  <a href=\"" + self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/" + path + "\">\n    " + (self.format(cov)) + "%\n  </a>\n</td>");
              } else {
                return $('td:last', this).after("<td></td>");
              }
            } else {
              return $('td:last', this).after("<td></td>");
            }
          } else {
            return $('td:last', this).after("<td></td>");
          }
        });
      } else {
        if ((ref4 = this.page) === 'commit' || ref4 === 'compare' || ref4 === 'pull') {
          $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat').append("<span class=\"codecov codecov-removable\"> <strong>" + (self.format(report.totals.c)) + "%</strong></span>");
        }
        self = this;
        total_hits = 0;
        total_lines = 0;
        split_view = $('.diff-table.file-diff-split').length > 0;
        if (self.page === 'blob') {
          _td = "td:eq(0)";
        } else if (split_view) {
          _td = "td:eq(2)";
        } else {
          _td = "td:eq(1)";
        }
        $('.repository-content .file').each(function() {
          var button, diff, file, file_data, file_lines, fp, hits, lines, ref5, ref6, ref7, ref8, ref9;
          file = $(this);
          fp = self.file || file.find('.file-info>a[title]').attr('title');
          if (fp) {
            if (indexOf.call(fp, '→') >= 0) {
              fp = fp.split('→')[1].trim();
            }
            file_data = report.files[fp];
            if (file.find('.file-actions > .BtnGroup').length === 0) {
              file.find('.file-actions a:first').wrap('<div class="BtnGroup"></div>');
            }
            if ((file_data != null) && (file_data != null ? file_data.ignored : void 0) !== true) {
              total = self.format(((ref5 = file_data.t) != null ? ref5.c : void 0) != null ? file_data.t.c : file_data.coverage);
              button = file.find('.btn.codecov').attr('aria-label', 'Toggle Codecov (c), alt+click to open in Codecov').attr('data-codecov-url', (self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/") + (((ref7 = file_data.t) != null ? ref7.c : void 0) != null ? "src/" + self.ref + "/" + fp : fp + "?ref=" + self.ref)).text(total + "%").removeClass('disabled').unbind().click((ref6 = self.page) === 'blob' || ref6 === 'blame' ? self.toggle_coverage : self.toggle_diff);
              hits = 0;
              lines = 0;
              file_lines = file_data.l != null ? file_data.l : file_data.lines;
              file.find('tr').each(function() {
                var cov, ref8, td;
                td = $(_td, this);
                cov = self.color(file_lines[td.attr('data-line-number') || ((ref8 = td.attr('id')) != null ? ref8.slice(1) : void 0)]);
                if (cov) {
                  if (split_view) {
                    $('td:eq(2), td:eq(3)', this).removeClass('codecov-hit codecov-missed codecov-partial').addClass("codecov codecov-" + cov);
                  } else {
                    $('td', this).removeClass('codecov-hit codecov-missed codecov-partial').addClass("codecov codecov-" + cov);
                  }
                  if ($('.blob-num-addition', this).length > 0) {
                    lines += 1;
                    if (cov === 'hit') {
                      return hits += 1;
                    }
                  }
                }
              });
              total_hits += hits;
              total_lines += lines;
              if ((ref8 = self.page) === 'commit' || ref8 === 'pull') {
                diff = self.format(self.ratio(hits, lines));
                button.text("Coverage " + total + "% (Diff " + diff + "%)");
                if (self.page === 'pull') {
                  $('a[href="#' + file.prev().attr('name') + '"] .diffstat').prepend("<span class=\"codecov codecov-removable\">" + total + "% <strong>(" + diff + "%)</strong></span>");
                } else {
                  $('a[href="#' + file.prev().attr('name') + '"]').parent().find('.diffstat').prepend("<span class=\"codecov codecov-removable\">" + total + "% <strong>(" + diff + "%)</strong></span>");
                }
              }
              if (self.settings.overlay && ((ref9 = self.page) === 'blob' || ref9 === 'blame')) {
                return button.trigger('click');
              }
            } else if ((file_data != null ? file_data.ignored : void 0) === true) {
              return file.find('.btn.codecov').attr('aria-label', 'File ignored').text('Not covered');
            } else {
              return file.find('.btn.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered');
            }
          }
        });
        if ((ref5 = self.page) === 'commit' || ref5 === 'compare' || ref5 === 'pull') {
          return $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat').find('.codecov').append(" (Diff <strong>" + (self.ratio(total_hits, total_lines)) + "%</strong>)</span>");
        }
      }
    }
  };

  Github.prototype.toggle_coverage = function(e) {
    if (e.shiftKey) {
      return window.location = $(this).attr('data-codecov-url');
    } else if ($('.codecov.codecov-on:first').length === 0) {
      $('.codecov').addClass('codecov-on');
      return $(this).addClass('selected');
    } else {
      $('.codecov').removeClass('codecov-on');
      return $(this).removeClass('selected');
    }
  };

  Github.prototype.toggle_diff = function(e) {

    /*
    CALLED: by user interaction
    GOAL: toggle coverage overlay on diff/compare
     */
    var file;
    if (e.altKey) {
      window.location = $(this).attr('data-codecov-url');
      return;
    }
    file = $(this).parents('.file');
    if ($(this).hasClass('selected')) {
      file.removeClass('codecov-enabled');
      $(this).removeClass('selected');
      if (!($('.diff-table.file-diff-split').length > 0)) {
        file.find('.blob-num-deletion').parent().show();
      }
      return file.find('.codecov').removeClass('codecov-on');
    } else {
      file.addClass('codecov-enabled');
      $(this).addClass('selected');
      if (!($('.diff-table.file-diff-split').length > 0)) {
        file.find('.blob-num-deletion').parent().hide();
      }
      return file.find('.codecov').addClass('codecov-on');
    }
  };

  Github.prototype.error = function(status, reason) {
    if (status === 401) {
      $('.btn.codecov').text("Please login at Codecov").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
        return window.location = self.settings.urls[self.urlid] + "/login/github?redirect=" + (escape(window.location.href));
      });
      return $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Please login into Codecov').attr('aria-label', 'Login to view coverage by Codecov').click(function() {
        return window.location = self.settings.urls[self.urlid] + "/login/github?redirect=" + (escape(window.location.href));
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

  Bitbucket.href;

  Bitbucket.prototype.get_ref = function(href) {
    var ref;
    this.log('::get_ref');
    this.service = window.location.hostname === 'bitbucket.org' || (this.settings.debug_url != null) ? 'bb' : 'bbs';
    if (this.page === 'src') {
      return href[6].split('?')[0];
    } else if (this.page === 'commits') {
      return href[6].split('?')[0];
    } else if (this.page === 'pull-requests') {
      return (ref = $('.view-file:first').attr('href')) != null ? ref.split('/')[4] : void 0;
    }
    return false;
  };

  Bitbucket.prototype.prepare = function() {
    this.log('::prepare');
    $('#editor-container, section.bb-udiff').each(function() {
      if ($('.aui-button.codecov', this).length === 0) {
        return $('.secondary>.aui-buttons:first', this).prepend('<a href="#" class="aui-button aui-button-light codecov"\ntitle="Requesting coverage from Codecov.io">Coverage loading...</a>');
      }
    });
    return true;
  };

  Bitbucket.prototype.overlay = function(res) {
    var ref, ref1, report, self;
    this.log('::overlay');
    self = this;
    $('.codecov.codecov-removable').remove();
    report = (res != null ? (ref = res.commit) != null ? ref.report : void 0 : void 0) || (res != null ? (ref1 = res.head) != null ? ref1.report : void 0 : void 0);
    $('#source-list tr td.dirname').attr('colspan', 5);
    $('#source-list tr').each(function() {
      var cov, fp, ref2, ref3, ref4;
      fp = (ref2 = $('a', this).attr('href')) != null ? ref2.split('?')[0].split('/').slice(5).join('/') : void 0;
      cov = report != null ? (ref3 = report.files) != null ? (ref4 = ref3[fp]) != null ? ref4.t.c : void 0 : void 0 : void 0;
      if (cov != null) {
        return $('td.size', this).after("<td title=\"Coverage\"\n    style=\"background:linear-gradient(90deg, " + (self.bg(cov)) + " " + cov + "%, white " + cov + "%);text-align:right;\"\n    class=\"codecov codecov-removable\">\n  " + (self.format(cov)) + "%\n</td>");
      } else {
        return $('td.size', this).after("<td style=\"color:#e7e7e7\">n/a</td>");
      }
    });
    $('section.bb-udiff').each(function() {
      var $file, button, data, fp, ref2;
      $file = $(this);
      fp = $file.attr('data-path');
      data = report != null ? (ref2 = report.files) != null ? ref2[fp] : void 0 : void 0;
      if (data != null) {
        button = $('.aui-button.codecov', this).attr('title', 'Toggle Codecov').text("Coverage " + (self.format(data.t.c)) + "%").attr('data-codecov-url', self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/src/" + self.ref + "/" + fp).unbind().click(self.toggle_diff);
        return $('.udiff-line.common, .udiff-line.addition', this).find('a.line-numbers').each(function() {
          var a, ln, ref3;
          a = $(this);
          ln = a.attr('data-tnum');
          ln = data != null ? (ref3 = data.l) != null ? ref3[ln] : void 0 : void 0;
          if (ln != null) {
            return a.addClass("codecov codecov-" + (self.color(ln)));
          }
        });
      } else {
        return $file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered');
      }
    });
    return $("#editor-container").each(function() {
      var $file, button, cov, file, filename, fp, ln, ref2, ref3, ref4;
      $file = $(this);
      fp = $file.attr('data-path');
      file = report != null ? (ref2 = report.files) != null ? ref2[fp] : void 0 : void 0;
      filename = fp.split('/').pop();
      if (file != null) {
        button = $file.find('.aui-button.codecov').attr('title', 'Toggle Codecov').text("Coverage " + (self.format(file.t.c)) + "%").attr('data-codecov-url', '[TODO]').unbind().click(self.toggle_coverage);
        ref3 = file['l'];
        for (ln in ref3) {
          cov = ref3[ln];
          $("a[name='" + filename + "-" + ln + "']", $file).addClass("codecov codecov-" + (self.color(cov)));
        }
        if (self.settings.overlay && ((ref4 = self.page) === 'src' || ref4 === '')) {
          return button.trigger('click');
        }
      } else {
        return $file.find('.aui-button.codecov').attr('title', 'File coverage not found').attr('data-codecov-url', '[TODO]').text('Not covered');
      }
    });
  };

  Bitbucket.prototype.toggle_coverage = function(e) {
    e.preventDefault();
    if (e.altKey || e.shiftKey) {
      return window.location = $(this).attr('data-codecov-url');
    } else if ($('.codecov.codecov-on:first').length === 0) {
      $('.codecov').addClass('codecov-on');
      return $(this).addClass('aui-button-light');
    } else {
      $('.codecov').removeClass('codecov-on');
      return $(this).removeClass('aui-button-light');
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

var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

window.BitbucketServer = (function(superClass) {
  extend(BitbucketServer, superClass);

  function BitbucketServer() {
    this.send_signal = bind(this.send_signal, this);
    this.update_view = bind(this.update_view, this);
    return BitbucketServer.__super__.constructor.apply(this, arguments);
  }

  BitbucketServer.last_href;

  BitbucketServer.time_interval;

  BitbucketServer.diff_view = false;

  BitbucketServer.sub_page;

  BitbucketServer.prototype.getParameterByName = function(name, url) {
    var regex, results;
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    results = regex.exec(url);
    if (results === null) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  BitbucketServer.prototype.get_ref = function(href) {
    var branch_str, commit_href, json, ref;
    this.log('::get_ref');
    this.service = 'bbs';
    if (this.page === 'browse') {
      if ($('.commitid').length !== 0) {
        ref = $('.commitid').attr('data-commitid');
      } else if ($('#repository-layout-revision-selector').length !== 0) {
        json = JSON.parse($('#repository-layout-revision-selector').children().eq(1).attr('data-revision-ref'));
        ref = json.latestCommit;
      }
      return ref;
    } else if (this.page === 'commits') {
      ref = 'branch/master/commits?';
      if (href[7] === 'commits' && typeof href[8] === 'undefined') {
        return ref;
      } else if (href[7].indexOf('?') !== -1) {
        this.diff_view = false;
        commit_href = href[7].split(this.page);
        if (commit_href[1] !== '?merges=include') {
          branch_str = this.getParameterByName('until', commit_href[1]);
          branch_str = branch_str.split('/');
          ref = branch_str[branch_str.length - 1];
        }
      } else {
        this.diff_view = true;
        if (href[8].indexOf('#') !== -1) {
          ref = href[8].split('#')[0];
        } else {
          ref = href[8];
        }
      }
      return ref;
    } else if (this.page === 'pull-requests') {
      this.sub_page = href[9];
      if (this.sub_page === 'commits') {
        if (href[10].indexOf('#') !== -1) {
          return href.split('#')[0];
        }
      }
    }
    return false;
  };

  BitbucketServer.prototype.load_properties = function() {
    var href;
    this.log('::load_properties');
    this.last_href = window.location.href;
    href = (this.settings.debug_url || this.last_href).split('/');
    if (href) {
      this.slug = href[4] + "/" + href[6];
      this.page = href[7].split('?')[0];
      return this.ref = this.get_ref(href);
    }
  };

  BitbucketServer.prototype.update_view = function() {
    this.log('::update_view');
    this.load_properties();
    this._run();
    clearTimeout(this.time_interval);
    return this.time_interval = 0;
  };

  BitbucketServer.prototype.send_signal = function() {
    this.log('::send_signal');
    return this.time_interval = setTimeout(this.update_view, 1500);
  };

  BitbucketServer.prototype.prepare = function() {
    this.log('::prepare');
    $('.file-toolbar > .secondary').prepend('<div class="aui-buttons"><button class="aui-button codecov" title="' + ("" + this.messages.status.pending.title) + '"> ' + ("" + this.messages.status.pending.text) + '</button></div>');
    return true;
  };


  /*
  _get: (endpoint) ->
    if @page is 'commits'
      if @diff_view
        @_process report_commit
        return report_commit
      else
        @_process report_commits
        return report_commits
  
    else if @page is 'pull-requests'
      return report_commit
    
    @_process report
    return report
   */

  BitbucketServer.prototype.overlay = function(res) {
    var base_url, button, c, commits, cov, coverage_url, filename, i, key, len, line, ref1, ref2, ref3, ref4, ref5, ref6, ref7, report, results1, self, value;
    this.log('::overlay');
    self = this;
    report = (res != null ? (ref1 = res.commit) != null ? ref1.report : void 0 : void 0) || (res != null ? (ref2 = res.head) != null ? ref2.report : void 0 : void 0);
    filename = '';
    if (this.page === 'commits') {
      if (this.diff_view) {
        $('.file-path > span').each(function(index, element) {
          return filename += $(element).text();
        });
        filename += "/" + ($('.breadcrumbs').children('.stub').text());
        cov = report != null ? (ref3 = report.files) != null ? ref3[filename] : void 0 : void 0;
        if (cov != null) {
          coverage_url = self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/src/" + self.ref + "/" + filename;
          button = $('.aui-button.codecov').attr('title', 'Toggle Codecov').text("Coverage " + (self.format(cov.t.c)) + "%").attr('data-codecov-url', coverage_url);
          ref4 = cov['l'];
          for (key in ref4) {
            value = ref4[key];
            if (value === 1) {
              line = $('.CodeMirror-code .line:nth-child(' + key + ')');
              line.children('.CodeMirror-gutter-wrapper').find('.line-number').addClass("codecov codecov-" + (self.color(value)));
            }
          }
        }
      } else {
        commits = {};
        ref5 = res.commits;
        for (i = 0, len = ref5.length; i < len; i++) {
          c = ref5[i];
          commits[c.commitid] = c;
        }
        base_url = self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/commit";
      }
      return $('#commits-table tr').each(function() {
        var commit, commit_data, commitid, ref6;
        commit = $(this);
        if (commit.find('.message').children('.codecov-on').length > 0) {
          return true;
        }
        commitid = commit.attr('data-commitid');
        commit_data = commits[commitid];
        if ((commit_data != null ? (ref6 = commit_data.totals) != null ? ref6.c : void 0 : void 0) != null) {
          return commit.find('.message').append("<a class=\"codecov-on\" title=\"Codecov Coverage\" href=\"" + base_url + "/" + commit_data.commitid + "\">" + (self.format(commit_data.totals.c)) + "%</Aa>");
        }
      });
    } else if (this.page === 'browse') {
      if ($('.file-path').length !== 0) {
        $('.file-path > a').each((function(_this) {
          return function(index, element) {
            if ($(element).text() !== _this.slug.split('/')[1]) {
              return filename += $(element).text() + '/';
            }
          };
        })(this));
      }
      filename += $('.breadcrumbs').children('.stub').text();
      $('#browse-table tr').each(function() {
        var ref6, ref7;
        if ($(this).hasClass('folder')) {
          return true;
        }
        if ($(this).children('.codecov-on').length !== 0) {
          return true;
        }
        filename += "/" + ($(this).find('td.item-name').children('a').text());
        cov = report != null ? (ref6 = report.files) != null ? (ref7 = ref6[filename]) != null ? ref7.t.c : void 0 : void 0 : void 0;
        if (cov != null) {
          return $(this).append("<td class=\"codecov-on\" title=\"Coverage\"\n    style=\"background:linear-gradient(90deg, " + (self.bg(cov)) + " " + cov + "%, white " + cov + "%);text-align:right;\"\n    class=\"codecov codecov-removable\">\n  " + (self.format(cov)) + "%\n</td>");
        } else {
          return $(this).append("<td class=\"codecov-on\" style=\"color:#e7e7e7\">n/a</td>");
        }
      });
      cov = report != null ? (ref6 = report.files) != null ? ref6[filename] : void 0 : void 0;
      if (cov != null) {
        button = $('.aui-button.codecov').attr('title', 'Toggle Codecov').text("Coverage " + (self.format(cov.t.c)) + "%").attr('data-codecov-url', self.settings.urls[self.urlid] + "/" + self.service + "/" + self.slug + "/src/" + self.ref + "/" + filename);
        $(button).on('click', function() {
          return self.update_view();
        });
        ref7 = cov['l'];
        results1 = [];
        for (key in ref7) {
          value = ref7[key];
          line = $('.CodeMirror-code .line:nth-child(' + key + ')');
          results1.push(line.addClass("codecov codecov-" + (self.color(value))));
        }
        return results1;
      }
    }
  };

  BitbucketServer.prototype._start = function() {
    var self;
    this.log('::start');
    this.bind_id = '';
    this.time_interval = 0;
    self = this;
    this.load_properties();
    if (this.page === 'browse') {
      if ($('#browse-table').length !== 0) {
        this.bind_id = '.filebrowser-content';
      } else {
        this.bind_id = '.content-view';
      }
    } else if (this.page === 'commits') {
      if (this.diff_view) {
        this.bind_id = '.commit-files';
      } else {
        this.bind_id = '#commits-table';
      }
    }
    $(this.bind_id).bind("DOMSubtreeModified", function() {
      if (self.time_interval === 0 && self.diff_view !== true) {
        self.last_href = window.location.href;
        return self.send_signal();
      }
    });
    this.log('::time_interval', this.time_interval);
    if (this.time_interval === 0) {
      self.send_signal();
    }
    return this.prepare();
  };

  return BitbucketServer;

})(Codecov);


