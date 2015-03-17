class Codecov
  slug: null  # :owner/:repo
  ref: null   # sha of head
  base: ''    # sha of base (compare|pull only)
  file: ''    # specific file name viewing (blob only)
  page: null  # type of github page: blob|compare|pull
  files: null # array of dom files
  found: no   # was coverage found
  settings:
    urls: ['https://codecov.io']
    first_view: 'im'
    debug: no
    callback: null

  constructor: ->
    self = @
    @settings = $.extend null, @settings, (window?.codecov_settings ? {})

    chrome.storage.sync.get {
      first_view: 'im',
      enterprise: ''
    }, (items) ->
      self.settings.first_view = items.first_view
      $.merge self.settings.urls, items.enterprise.split("\n").filter((a) -> a)

      # attach stylesheet
      # =================
      unless $('#codecov-css').length > 0
        $('head').append("<link href=\"#{chrome.extension.getURL('dist/github.css')}\" rel=\"stylesheet\" id=\"codecov-css\">")

      href = (self.settings.debug or document.URL).split('/')
      self.slug = "#{href[3]}/#{href[4]}"
      self.page = href[5]

      # get ref
      # =======
      if self.page is 'commit'
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

      self.run()

  run: ->
    # get files
    # =========
    @files = $('.repository-content .file')
    return if @files.length is 0

    self = @

    @files.each ->
      file = $(@)
      if file.find('.minibutton.codecov').length is 0
        if file.find('.file-actions > .button-group').length is 0
          file.find('.file-actions a:first')
              .wrap('<div class="button-group"></div>')
        file.find('.file-actions > .button-group')
            .prepend('<a class="minibutton codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io" data-hotkey="c">Coverage loading...</a>')

    chrome.storage.local.get "#{self.slug}/#{self.ref}", (res) ->
      if res?[self.ref]
        self.process res[self.ref]
      else
        self.get self.settings.urls.shift()

  get: (endpoint) ->
    self = @
    # get coverage
    # ============
    $.ajax
      url: "#{endpoint}/github/#{self.slug}#{self.file}?ref=#{self.ref}#{self.base}"
      type: 'get'
      dataType: 'json'
      headers:
        Accept: 'application/json'
      success: (res) ->
        self.found = yes
        self.process res, yes
      complete: -> self.settings?.callback?() # for testing purposes
      error: -> self.get(self.settings.urls.shift()) if self.settings.urls.length > 0
      statusCode:
        401: ->
          $('.minibutton.codecov').text("Please login at Codecov.io").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov.io') unless self.found
        404: ->
          $('.minibutton.codecov').text("No coverage").attr('aria-label', 'Coverage not found') unless self.found
        500: ->
          $('.minibutton.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry') unless self.found

  process: (res, store) ->
    self = @
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
    $('table-of-contents').find('li').each ->
      $('.diffstat.right', @).prepend("#{res.report.files[$('a', @).text()]?.coverage.toFixed(0)}%")

    self.files.each ->
      file = $(@)
      # find covered file
      # =================
      if self.page in ['blob', 'blame']
        coverage = res['report']
      else
        coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')]

      # assure button group
      if file.find('.file-actions > .button-group').length is 0
        file.find('.file-actions a:first').wrap('<div class="button-group"></div>')

      # report coverage
      # ===============
      if coverage
        # ... show diff not full file coverage for compare view
        button = file.find('.minibutton.codecov')
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
        file.find('.minibutton.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered')

    if store
      chrome.storage.local.set {"#{self.slug}/#{self.ref}": res}, -> null

  toggle_coverage: ->
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
