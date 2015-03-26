class Codecov
  slug: null  # :owner/:repo
  ref: null   # sha of head
  base: ''    # sha of base (compare|pull only)
  file: ''    # specific file name viewing (blob only)
  page: null  # type of github page: blob|compare|pull
  files: null # array of dom files
  found: no   # was coverage found
  urlid: 0    # which url to use when searching reports
  cache: [null, null]
  settings:
    urls: ['https://codecov.io']
    first_view: 'im'
    debug: no
    callback: null

  log: -> console.log('codecov', @, arguments) if @settings.debug

  constructor: ->
    ###
    Called once at start of extension
    ###
    self = @

    # establish settings
    # ------------------
    @settings = $.extend null, @settings, (window?.codecov_settings ? {})

    chrome.storage.sync.get {
      first_view: 'im',
      enterprise: ''
    }, (items) ->
      self.settings.first_view = items.first_view
      $.merge self.settings.urls, (items.enterprise or "").split("\n").filter((a) -> a)

    ###
    listen to dom changes
    ---------------------
    ###
    script = document.createElement('script')
    script.textContent = """$(document).on('pjax:success',function(){window.postMessage({type:"codecov"},"*");});"""
    (document.head or document.documentElement).appendChild(script);
    script.parentNode.removeChild(script)

    window.addEventListener "message", ((event) ->
      return unless event.source is window
      if event.data.type and event.data.type is "codecov"
        self.log('pjax event received')
        self.get_coverage()
    ), no

    # Go
    self.get_coverage()

  get_coverage: ->
    ###
    CALLED: when dom changes and page first loads
    GOAL: is to collect page variables, insert dom elements, bind callbacks
    ###
    self.log('::get_coverage')
    self = @
    href = (self.settings.debug or document.URL).split('/')
    self.slug = "#{href[3]}/#{href[4]}"
    self.page = href[5]

    # get ref
    # =======
    if self.page is 'find'
      # https://github.com/codecov/codecov-python/find/master
      self.ref = href[6]

    else if self.page is 'commit'
      # https://github.com/codecov/codecov-python/commit/b0a3eef1c9c456e1794c503aacaff660a1a197aa
      self.ref = href[6]

    else if self.page in ['blob', 'blame']
      # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
      # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
      split = $('a[data-hotkey=y]').attr('href').split('/')
      self.ref = split[4]
      self.file = "/#{split[5..].join('/')}"

    else if self.page is 'compare'
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      self.base = "&base=#{$('.commit-id:first').text()}"
      self.ref = $('.commit-id:last').text()

    else if self.page is 'pull'
      # https://github.com/codecov/codecov-python/pull/16/files
      self.base = "&base=#{$('.commit-id:first').text()}"
      self.ref = $('.commit-id:last').text()

    else
      return

    # get files
    # =========
    @files = $('.repository-content .file')

    # add Coverage Toggle
    # -------------------
    @files.each ->
      file = $(@)
      if file.find('.btn.codecov').length is 0
        if file.find('.file-actions > .btn-group').length is 0
          file.find('.file-actions a:first')
              .wrap('<div class="btn-group"></div>')
        file.find('.file-actions > .btn-group')
            .prepend('<a class="btn btn-sm codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io" data-hotkey="c">Coverage loading...</a>')

    # add Tree List Header
    # --------------------
    $('#tree-finder-results').before """
      <div class="commit commit-tease codecov">
        <div class="commit-meta">
          <span class="sha-block">coverage loading...</span>
          <div class="authorship">
            <img alt="@codecov" class="avatar" data-user="8226205" height="20" src="https://avatars2.githubusercontent.com/u/8226205?v=3&amp;s=40" width="20"><span class="author-name"><a href="https://codecov.io/github/#{self.slug}?ref=#{self.ref}">Codecov</a></span> coverage results
          </div>
        </div>
      </div>
      """

    # Add listender to tree query
    # ---------------------------
    $('#tree-finder-field').keyup -> setTimeout (-> self.run_coverage()), 100

    # ok GO!
    @run_coverage()

  run_coverage: ->
    ###
    CALLED: when coverage should be retrieved.
    GOAL: get coverage from cache -> storage -> URL
    ###
    return if @_processing
    self.log('::run_coverage')
    self = @
    slugref = "#{self.slug}/#{self.ref}"

    # get fron chrome storage
    # -----------------------
    @_processing = yes
    if @cache[0] == slugref
      self.log('process(cache)')
      @process @cache[1]
    else
      chrome.storage.local.get slugref, (res) ->
        if res?[self.ref]
          self.log('process(storage)', res[self.ref])
          self.process res[self.ref]
        else
          # run first url
          self.get self.settings.urls[self.urlid]

  get: (endpoint) ->
    ###
    CALLED: to get the coverage report from Codecov (or Enterprise urls)
    GOAL: http fetch coverage
    ###
    self = @
    self.log('::get', endpoint)
    # get coverage
    # ============
    $.ajax
      url: "#{endpoint}/github/#{self.slug}#{self.file}?ref=#{self.ref}#{self.base}"
      type: 'get'
      dataType: 'json'
      headers: Accept: 'application/json'
      success: (res) ->
        self.url = endpoint # keep the url that worked
        self.found = yes
        self.process res, yes

      # for testing purposes
      complete: ->
        self.log('::ajax.complete', arguments)
        self.settings?.callback?()

      # try to get coverage data from enterprise urls if any
      error: ->
        self.get(self.settings.urls[self.urlid+=1]) if self.settings.urls.length > self.urlid

      statusCode:
        401: ->
          unless self.found
            $('.btn.codecov').text("Please login at Codecov.io").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov').click -> window.location = "https://codecov.io/login/github?redirect=#{escape window.location.href}"
            $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Please login at Codecov.io').attr('aria-label', 'Login to view coverage by Codecov').click -> window.location = "https://codecov.io/login/github?redirect=#{escape window.location.href}"
        404: ->
          unless self.found
            $('.btn.codecov').text("No coverage").attr('aria-label', 'Coverage not found')
            $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('No coverage').attr('aria-label', 'Coverage not found')
        500: ->
          unless self.found
            $('.btn.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry')
            $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('aria-label', 'There was an error loading coverage. Sorry')

  process: (res, store=no) ->
    ###
    CALLED: to process report data
    GOAL: to update the dom with coverage
    ###
    self.log('::process')
    @_processing = no
    self = @
    slugref = "#{self.slug}/#{self.ref}"
    # cache in extension
    self.cache = [slugref, res]
    # cache in chrome storage
    if store and self.cacheable
      chrome.storage.local.set {slugref: res}, -> null

    if self.page is 'find'
      $('.commit.codecov .sha-block').html("total coverage <span class=\"sha\">#{Math.floor res['report']['coverage']}%</span>")
      $('#tree-finder-results .sha.codecov').remove()
      $('#tree-finder-results tr a').each ->
        coverage = res['report']['files'][$(@).attr('href').split('/')[7..].join('/')]?.coverage
        $(@).after("<span class=\"sha codecov\">#{Math.floor coverage}%</span>") if coverage >= 0

    else
      if self.page in ['commit', 'compare', 'pull']
        if res['base']
          compare = (res['report']['coverage'] - res['base']).toFixed(0)
          plus = if compare > 0 then '+' else '-'
          $('.toc-diff-stats').append(if compare is '0' then "Coverage did not change." else " Coverage changed <strong>#{plus}#{compare}%</strong>")
          $('#diffstat').append("<span class=\"text-diff-#{if compare > 0 then 'added' else 'deleted'} tooltipped tooltipped-s\" aria-label=\"Coverage #{if compare > 0 then 'increased' else 'decreased'} #{plus}#{compare}%\">#{plus}#{compare}%</span>")
        else
          coverage = res['report']['coverage'].toFixed(0)
          $('.toc-diff-stats').append(" Coverage <strong>#{coverage}%</strong>")
          $('#diffstat').append("<span class=\"tooltipped tooltipped-s\" aria-label=\"Coverage #{coverage}%\">#{coverage}%</span>")

      # compare in toc
      $('#toc li').each ->
        cov = res.report.files[$('a', @).text()]?.coverage
        $('.diffstat.right', @).prepend("#{Math.round cov}%") if cov >= 0

      self.files.each ->
        file = $(@)
        # find covered file
        # =================
        if self.page in ['blob', 'blame']
          coverage = res['report']
        else
          coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')]

        # assure button group
        if file.find('.file-actions > .btn-group').length is 0
          file.find('.file-actions a:first').wrap('<div class="btn-group"></div>')

        # report coverage
        # ===============
        if coverage
          # ... show diff not full file coverage for compare view
          button = file.find('.btn.codecov')
                       .attr('aria-label', 'Toggle Codecov (c)')
                       .text('Coverage '+coverage['coverage'].toFixed(0)+'%')
                       .removeClass('disabled')
                       .unbind()
                       .click(if self.page in ['blob', 'blame'] then self.toggle_coverage else self.toggle_diff)

          # overlay coverage
          _td = "td:eq(#{if self.page is 'blob' then 0 else 1})"
          file.find('tr').each ->
            td = $(@).find(_td)
            cov = self.color coverage['lines'][td.attr('data-line-number') or (td.attr('id')?[1..])]
            $(@).find('td').addClass "codecov codecov-#{cov}"

          # toggle blob/blame
          if self.page in ['blob', 'blame']
            button.trigger('click') for _ in self.settings.first_view

        else
          file.find('.btn.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered')

  toggle_coverage: ->
    ###
    CALLED: by user interaction
    GOAL: toggle coverage overlay on blobs/commits/blames/etc.
    ###
    self.log('::toggle_coverage')
    if $('.codecov.codecov-hit.codecov-on').length > 0
      # toggle hits off
      $('.codecov.codecov-hit').removeClass('codecov-on')
    else if $('.codecov.codecov-on').length > 0
      # toggle all off
      $('.codecov').removeClass('codecov-on')
      $(@).removeClass('selected')
    else
      # toggle all on
      $('.codecov').addClass('codecov-on')
      $(@).addClass('selected')

  toggle_diff: ->
    ###
    CALLED: by user interaction
    GOAL: toggle coverage overlay on diff/compare
    ###
    self.log('::toggle_diff')
    file = $(@).parents('.file')
    if $(@).hasClass('selected')
      # toggle off
      $(@).removeClass('selected')
      # show deleted lines
      file.find('.blob-num-deletion').parent().show()
      # remove covered lines
      file.find('.codecov').removeClass('codecov-on')
    else
      # toggle on
      $(@).addClass('selected')
      # hide deleted lines
      file.find('.blob-num-deletion').parent().hide()
      # fill w/ coverage
      file.find('.codecov').addClass('codecov-on')

  color: (ln) ->
    if ln is 0
      "missed"
    else if not ln
      null
    else if ln is true
      "partial"
    else if typeof ln is 'list'
      h = $.grep(ln, (p) -> p[2]>0).length > 0
      m = $.grep(ln, (p) -> p[2]==0).length > 0
      if h and m then "partial" else if h then "hit" else "missed"
    else if '/' in ln.toString()
      v = ln.split('/')
      if v[0] is '0'
        "missed"
      else if v[0] == v[1]
        "hit"
      else
        "partial"
    else
      "hit"

$ -> window.codecov = new Codecov
