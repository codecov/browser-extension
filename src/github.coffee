class Codecov
  slug: null  # :owner/:repo
  ref: null   # sha of head
  base: ''    # sha of base (compare|pull only)
  file: ''    # specific file name viewing (blob only)
  page: null  # type of github page: blob|compare|pull
  files: null # array of dom files
  settings:
    url: 'https://codecov.io'
    debug: no

  constructor: (settings) ->
    @settings = $.extend null, @settings, settings

    # attach stylesheet
    # =================
    unless $('#codecov-css').length > 0
      $('head').append("<link href=\"#{chrome.extension.getURL('dist/github.css')}\" rel=\"stylesheet\" id=\"codecov-css\">")

    @slug = (@settings.debug or document.URL).replace(/.*:\/\/github.com\//, '').match(/^[^\/]+\/[^\/]+/)[0]

    # get ref
    # =======
    # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
    # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
    @page = 'blob'
    hotkey = $('a[data-hotkey=y]')
    if hotkey.length > 0 
      split = hotkey.attr('href').split('/')
      if split[3] is 'blob'
        @ref = split[4]
        @file = "/#{split.slice(5).join('/')}"

      else if split[3] is 'commit'
        @ref = split[4]

    unless @ref
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      @base = "&base=#{$('.commit-id:first').text()}"
      @ref = $('.commit-id:last').text()
      @page = 'compare'

    unless @ref
      # https://github.com/codecov/codecov-python/pull/16/files
      @base = "&base=#{$('.current-branch:first').text()}"
      @ref = $('.current-branch:last').text()
      @page = 'pull'

    return unless @ref

    @run()

  run: ->
    # get files
    # =========
    @files = $('.repository-content .file')
    return unless @files

    self = @

    # get coverage
    # ============
    $.ajax
      url: "#{@settings.url}/github/#{@slug}#{@file}?ref=#{@ref}#{@base}"
      type: 'get'
      dataType: 'json'
      headers:
        Accept: 'application/json'
      beforeSend: ->
        # show loading coverage
        self.files.each ->
          file = $(@)
          unless file.find('.minibutton.codecov')
            if file.find('.file-actions > .button-group').length is 0
              file.find('.file-actions a:first').wrap('<div class="button-group"></div>')
            file.find('.file-actions > .button-group').prepend('<a class="minibutton codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io">Coverage loading...</a>')

      success: (res) ->
        if self.page isnt 'blob'
          if res['base']
            compare = (res['report']['coverage'] - res['base']).toFixed(0)
            plus = if compare > 0 then '+' else '-'
            $('.toc-diff-stats').append(" Coverage <strong>#{plus}#{compare}%</strong>")
            $('#diffstat').append("<span class=\"text-diff-#{if compare > 0 then 'added' else 'deleted'} tooltipped tooltipped-s\" aria-label=\"Coverage #{if compare > 0 then 'increased' else 'decreased'} #{plus}#{compare}%\">#{plus}#{compare}%</span>")
          else
            coverage = res['report']['coverage'].toFixed(0)
            $('.toc-diff-stats').append(" Coverage <strong>#{coverage}%</strong>")
            $('#diffstat').append("<span class=\"tooltipped tooltipped-s\" aria-label=\"Coverage #{coverage}%\">#{coverage}%</span>")

        # compare in toc
        $('table-of-contents').find('li').each ->
          file = $(@)
          filename = file.find('a').text()
          coverage = res.report.files[filename]?.coverage.toFixed(0)
          file.find('.diffstat.right').prepend("#{coverage}%")

        self.files.each ->
          file = $(@)
          # find covered file
          # =================
          if self.page is 'compare'
            coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')]
          else if self.page is 'blob'
            coverage = res['report']

          # assure button group
          if file.find('.file-actions > .button-group').length is 0
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>')

          # report coverage
          # ===============
          if coverage
            # ... show diff not full file coverage for compare view
            button = file.find('.minibutton.codecov')
                         .attr('aria-label', 'Toggle Codecov')
                         .text('Coverage '+coverage['coverage'].toFixed(0)+'%')
                         .removeClass('disabled')
                         .unbind()
                         .click(if self.page is 'blob' then self.toggle_coverage else self.toggle_diff)

            # overlay coverage
            file.find('tr').each ->
              cov = self.color coverage['lines'][$(@).find("td:eq(#{if self.page is 'blob' then 0 else 1})").attr('data-line-number')]
              $(@).find('td').addClass "codecov codecov-#{cov}"

            # turn on blob by default
            if self.page is 'blob'
              # default important only
              button.trigger('click')
              button.trigger('click')

          else
            file.find('.minibutton.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered')

      statusCode:
        401: ->
          $('.minibutton.codecov').text("Please login at Codecov.io").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov.io')
          # todo inform user that they need to login
        404: ->
          $('.minibutton.codecov').text("No coverage").attr('aria-label', 'Coverage not found')
        500: ->
          $('.minibutton.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry')

      complete: -> self.settings?.callback?()

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
    if file.find('.blob-num-deletion:first').parent().is(':visible')
      $(@).addClass('selected')
      # hide deleted lines
      file.find('.blob-num-deletion').parent().hide()
      # fill w/ coverage
      file.find('.codecov').addClass('codecov-on')
    else
      $(@).removeClass('selected')
      # show deleted lines
      file.find('.blob-num-deletion').parent().show()
      # remove covered lines
      file.find('.codecov').removeClass('codecov-on')

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

$ -> new Codecov
