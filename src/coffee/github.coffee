class window.Github extends Codecov
  get_ref: (href) ->
    @service = 'github'
    if @page in ['releases', 'tags']
      # planned
      return no

    else if @page is 'commit'
      # https://github.com/codecov/codecov-python/commit/b0a3eef1c9c456e1794c503aacaff660a1a197aa
      return href[6]

    else if @page in ['blob', 'blame']
      # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
      # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
      split = $('a[data-hotkey=y]').attr('href').split('/')
      @file = "#{split[5..].join('/')}"
      return split[4]

    else if @page is 'compare'
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      @base = "&base=#{$('.commit-id:first').text()}"
      return $('.commit-id:last').text()

    else if @page is 'pull'
      # https://github.com/codecov/codecov-python/pull/16/files
      @base = "&base=#{$('.commit-id:first').text()}"
      return $('.commit-id:last').text()

    else if @page is 'tree'
      return $('.commit-meta .sha-block').attr('href').split('/').pop()

    else
      # no coverage overlay
      return no

  prepare: ->
    @log('::prepare')
    # add Coverage Toggle
    $('.repository-content .file').each ->
      file = $(@)
      if file.find('.btn.codecov').length is 0
        if file.find('.file-actions > .btn-group').length is 0
          file.find('.file-actions a:first')
              .wrap('<div class="btn-group"></div>')
        file.find('.file-actions > .btn-group')
            .prepend('<a class="btn btn-sm codecov disabled tooltipped tooltipped-n" aria-label="Requesting coverage from Codecov.io" data-hotkey="c">Coverage loading...</a>')

    yes  # get content to overlay

  overlay: (res) ->
    if @page is 'tree'
      $('.commit-meta').prepend("""<a href="#{@settings.urls[@urlid]}/github/#{@slug}?ref=#{@ref}" class="sha-block codecov tooltipped tooltipped-n" aria-label="Overall coverage">#{Math.floor res['report']['coverage']}%</a>""")
      $('.file-wrap tr:not(.warning):not(.up-tree)').each ->
        filepath = $('td.content a', @).attr('href')?.split('/')[5..].join('/')
        if filepath
          coverage = res['report']['files']?[filepath]?.coverage
          unless coverage?.ignored
            $('td:last', @).append("""<span class="sha codecov tooltipped tooltipped-n" aria-label="Coverage">#{Math.floor coverage}%</span>""") if coverage >= 0

    else
      if @page in ['commit', 'compare', 'pull']
        if res['base']
          compare = (res['report']['coverage'] - res['base']).toFixed(0)
          plus = if compare > 0 then '+' else '-'
          $('.toc-diff-stats').append(if compare is '0' then "Coverage did not change." else " Coverage changed <strong>#{plus}#{compare}%</strong>")
          $('#diffstat').append("""<span class="text-diff-#{if compare > 0 then 'added' else 'deleted'} tooltipped tooltipped-s" aria-label="Coverage #{if compare > 0 then 'increased' else 'decreased'} #{plus}#{compare}%">#{plus}#{compare}%</span>""")
        else
          coverage = res['report']['coverage'].toFixed(0)
          unless coverage?.ignored
            $('.toc-diff-stats').append(" Coverage <strong>#{coverage}%</strong>")
            $('#diffstat').append("""<span class="tooltipped tooltipped-s" aria-label="Coverage #{coverage}%">#{coverage}%</span>""")

      # compare in toc
      $('#toc li').each ->
        coverage = res.report.files[$('a', @).text()]
        unless coverage?.ignored
          cov = coverage?.coverage
          $('.diffstat.right', @).prepend("#{Math.round cov}%") if cov >= 0

      self = @
      $('.repository-content .file').each ->
        file = $(@)

        # find covered file
        fp = self.file or file.find('.file-info>span[title]').attr('title')
        coverage = res['report']['files'][fp] or self.find_best_fit_path(fp, res['report']['files'])
        unless coverage?.ignored

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

  error: (status, reason) ->
    if status is 401
      $('.btn.codecov').text("Please login at Codecov").addClass('danger').attr('aria-label', 'Login to view coverage by Codecov').click -> window.location = "https://codecov.io/login/github?redirect=#{escape window.location.href}"
      $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Please login at Codecov.io').attr('aria-label', 'Login to view coverage by Codecov').click -> window.location = "https://codecov.io/login/github?redirect=#{escape window.location.href}"
    else if status is 404
      $('.btn.codecov').text("No coverage").attr('aria-label', 'Coverage not found')
      $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('No coverage').attr('aria-label', 'Coverage not found')
    else if status is 500
      $('.btn.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry')
      $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('aria-label', 'There was an error loading coverage. Sorry')
