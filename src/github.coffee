Codecov = 
  settings:
    show_missed: yes
    show_partial: yes
    url: 'https://codecov.io'
    show_hit: no
  run: ->
    # get files
    # =========
    files = $('.repository-content .file')
    return unless files

    # get ref
    # =======
    # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
    # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
    method = 'file'
    hotkey = $('[data-hotkey=y]')
    if hotkey.length > 0 
      split = hotkey.attr('href').split('/')
      if split[3] is 'blob'
        ref = split[4]

    unless ref
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      ref = $('.commit-id:last').text()
      method = 'compare'

    unless ref
      # https://github.com/codecov/codecov-python/pull/18/files
      ref = $('.current-branch:last').text()
      method = 'pull'

    # attach stylesheet
    # =================
    stylesheet = document.createElement('link')
    stylesheet.href = chrome.extension.getURL('dist/github.css')
    stylesheet.rel = 'stylesheet'
    head = document.getElementsByTagName('head')[0] or document.documentElement
    head.insertBefore stylesheet, head.lastChild

    # get coverage
    # ============
    $.ajax
      url: "#{Codecov.settings.url}/github/#{document.URL.replace(/.*:\/\/github.com\//, '').match(/^[^\/]+\/[^\/]+/)[0]}?ref=#{ref}"
      method: 'get'
      headers:
        Accept: 'application/json'
      # beforeSend: ->
      #   # show loading coverage
      #   files.each ->
      #     if file.find('.file-actions > .button-group').length is 0
      #       file.find('.file-actions a:first').wrap('<div class="button-group"></div>')

      success: (res) ->
        files.each ->
          file = $(@)
          # get file coverage
          if method is 'compare'
            coverage = res['report']['files'][file.find('.file-info>span[title]').attr('title')]
          else if method is 'file'
            coverage = res['report']['files'][file.find('#raw-url').attr('href').split('/').slice(5).join('/')]

          # assure button group
          if file.find('.file-actions > .button-group').length is 0
            file.find('.file-actions a:first').wrap('<div class="button-group"></div>')

          # report coverage
          if coverage
            # ... show diff not full file coverage for compare view
            file.find('.file-actions > .button-group').prepend($('<a class="minibutton tooltipped tooltipped-n selected" aria-label="Provided by codecov.io">Coverage '+coverage['coverage']+'%</a>').click(Codecov.toggle))
            file.find('tr').each ->
              cov = Codecov.coverage coverage['lines'][$(@).find('td:eq(0)').attr('data-line-number') or $(@).find('td:eq(1)').attr('data-line-number')]
              $(@).find('td').addClass "codecov codecov-#{cov}"
          else
            file.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported - by bodecov.io">No coverage</a>')

      statusCode:
        401: ->
          # todo inform user that they need to login
        404: ->
          if method is 'file'
            files.find('.file-actions > .button-group').prepend('<a class="minibutton disabled tooltipped tooltipped-n" aria-label="Commit not found or file not reported at codecov.io">No coverage</a>')

  toggle: ->
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

  coverage: (ln) ->
    if ln is 0
      return "missed#{if Codecov.settings.show_missed then ' codecov-on' else ''}"
    else if ln is undefined
      return null
    else if ln is true
      return "partial#{if Codecov.settings.show_partial then ' codecov-on' else ''}"
    else if '/' in ln.toString()
      v = ln.split('/')
      if v[0] is '0'
        return "missed#{if Codecov.settings.show_missed then ' codecov-on' else ''}"
      else if v[0] == v[1]
        return "hit#{if Codecov.settings.show_hit then ' codecov-on' else ''}"
      else
        return "partial#{if Codecov.settings.show_partial then ' codecov-on' else ''}"
    else
      return "hit#{if Codecov.settings.show_hit then ' codecov-on' else ''}"

$ Codecov.run
