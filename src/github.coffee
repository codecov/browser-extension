class Codecov
  slug: null
  ref: null
  method: null
  files: null
  settings:
    url: 'https://codecov.io'
    show_missed: yes
    show_partial: yes
    show_hit: no
    method: null
    files: null

  constructor: ->
    # attach stylesheet
    # =================
    stylesheet = document.createElement('link')
    stylesheet.href = chrome.extension.getURL('dist/github.css')
    stylesheet.rel = 'stylesheet'
    head = document.getElementsByTagName('head')[0] or document.documentElement
    head.insertBefore stylesheet, head.lastChild

    @slug = document.URL.replace(/.*:\/\/github.com\//, '').match(/^[^\/]+\/[^\/]+/)[0]

    # get ref
    # =======
    # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
    # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
    @method = 'blob'
    hotkey = $('[data-hotkey=y]')
    if hotkey.length > 0 
      split = hotkey.attr('href').split('/')
      if split[3] is 'blob'
        @ref = split[4]

    unless @ref
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      @ref = $('.commit-id:last').text()
      @method = 'compare'

    unless @ref
      # https://github.com/codecov/codecov-python/pull/18/files
      @ref = $('.current-branch:last').text()
      @method = 'pull'

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
      url: "#{@settings.url}/github/#{@slug}?ref=#{@ref}"
      method: 'get'
      headers:
        Accept: 'application/json'
      beforeSend: ->
        # show loading coverage
        self.files.each ->
          file = $(@)
          if file.find('.file-actions > .button-group').length is 0
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>')
          file.find('.file-actions > .button-group').prepend('<a class="minibutton codecov disabled tooltipped tooltipped-n" aria-label="Coverage loading...">Coverage loading...</a>')

      success: (res) ->
        self.files.each ->
          file = $(@)
          # get file coverage
          if self.method is 'compare'
            coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')]
          else if self.method is 'blob'
            coverage = res['report']['files'][file.find('#raw-url').attr('href').split('/').slice(5).join('/')]

          # assure button group
          if file.find('.file-actions > .button-group').length is 0
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>')

          # report coverage
          if coverage
            # ... show diff not full file coverage for compare view
            button = file.find('.minibutton.codecov')
                         .attr('aria-label', 'Toggle Codecov')
                         .text('Coverage '+coverage['coverage']+'%')
                         .removeClass('disabled')
                         .unbind()
                         .click(if self.method is 'blob' then self.toggle_coverage else self.toggle_diff)

            # overlay coverage
            file.find('tr').each ->
              cov = self.color coverage['lines'][$(@).find("td:eq(#{if self.method is 'blob' then 0 else 1})").attr('data-line-number')]
              $(@).find('td').addClass "codecov codecov-#{cov}"

            # turn on blob by default
            button.trigger('click') if self.method is 'blob'

          else
            file.find('.minibutton.codecov').attr('aria-label', 'Commit not found or file not reported to Codecov').text('No coverage')

      statusCode:
        401: ->
          # todo inform user that they need to login
        404: ->
          if self.method is 'blob'
            self.files.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported at codecov.io">No coverage</a>')

  toggle_coverage: ->
    console.log @
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
    else if ln is undefined
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
