class window.Github extends Codecov
  get_ref: (href) ->
    @service = if window.location.hostname is 'github.com' or @settings.debug_url? then 'gh' else 'ghe'
    @file = null
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
      return $('.js-permalink-shortcut').attr('href').split('/')[4]

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
    @log('::overlay')
    self = @
    $('.codecov-removable').remove()
    if @page is 'tree'
      replacement = "/#{self.slug}/blob/#{$('.file-navigation .repo-root a:first').attr('data-branch')}/"
      $('.commit-tease span.right').append("""<a href="#{@settings.urls[@urlid]}/github/#{@slug}?ref=#{@ref}" class="sha-block codecov codecov-removable tooltipped tooltipped-n" aria-label="Overall coverage">#{res['report']['coverage'].toFixed(2)}%</a>""")
      $('.file-wrap tr:not(.warning):not(.up-tree)').each ->
        filepath = $('td.content a', @).attr('href')?.replace(replacement, '')
        if filepath
          coverage = res['report']['files']?[filepath]?.coverage
          unless coverage?.ignored
            $('td:last', @).append("""<a href="#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/#{filepath}?ref=#{self.ref}" class="sha codecov codecov-removable tooltipped tooltipped-n" aria-label="Coverage">#{coverage.toFixed(2)}%</a>""") if coverage >= 0

    else
      if @page in ['commit', 'compare', 'pull']
        if res['base']
          compare = (res['report']['coverage'] - res['base']).toFixed(2)
          plus = if compare > 0 then '+' else '-'
          $('.toc-diff-stats').append(if compare is '0.00' then '<span class="codecov codecov-removable">Coverage did not change.</span>' else """<span class="codecov codecov-removable"> Coverage changed <strong>#{plus}#{compare}%</strong></span>""")
        else
          coverage = res['report']['coverage'].toFixed(2)
          unless coverage?.ignored
            $('.toc-diff-stats').append("""<span class="codecov codecov-removable"> Coverage <strong>#{coverage}%</strong></span>""")

      self = @
      total_hits = 0
      total_lines = 0

      # which <td> is the source code
      split_view = $('.diff-table.file-diff-split').length > 0
      if self.page is 'blob'
        _td = "td:eq(0)"
      else if split_view
        _td = "td:eq(2)"
      else
        _td = "td:eq(1)"

      $('.repository-content .file').each ->
        file = $(@)

        # find covered file
        fp = self.file or file.find('.file-info>span[title]').attr('title')
        if fp
          coverage = res['report']['files'][fp]
          unless coverage?.ignored

            # assure button group
            if file.find('.file-actions > .btn-group').length is 0
              file.find('.file-actions a:first').wrap('<div class="btn-group"></div>')

            # report coverage
            # ===============
            if coverage
              coverage_precent = coverage['coverage'].toFixed(2)
              coverage_precent = '100' if coverage_precent == '100.00'

              button = file.find('.btn.codecov')
                           .attr('aria-label', 'Toggle Codecov (c), shift+click to open in Codecov')
                           .attr('data-codecov-url', "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/#{fp}?ref=#{self.ref}")
                           .text("Coverage #{coverage_precent}%")
                           .removeClass('disabled')
                           .unbind()
                           .click(if self.page in ['blob', 'blame'] then self.toggle_coverage else self.toggle_diff)

              # overlay coverage
              hits = 0
              lines = 0
              file.find('tr').each ->
                td = $(_td, @)
                cov = self.color coverage['lines'][td.attr('data-line-number') or (td.attr('id')?[1..])]
                if cov
                  if split_view
                    # only add codecov classes on last two columns
                    $('td:eq(2), td:eq(3)', @).removeClass('codecov-hit codecov-missed codecov-partial').addClass("codecov codecov-#{cov}")
                  else
                    $('td', @).removeClass('codecov-hit codecov-missed codecov-partial').addClass("codecov codecov-#{cov}")

                  if $('.blob-num-addition', @).length > 0
                    lines += 1
                    hits += 1 if cov is 'hit'

              total_hits += hits
              total_lines += lines

              if self.page in ['commit', 'compare', 'pull']
                diff = self.ratio hits, lines
                button.text("Coverage #{coverage_precent}% (Diff #{diff}%)")
                # update in toc
                $('#toc a[href="#'+file.prev().attr('name')+'"]')
                  .parent('span.diffstat')
                  .prepend("""<span class="codecov codecov-removable">#{coverage_precent}% <strong>(#{diff}%)</strong></span>""")

              # toggle blob/blame
              if self.settings.overlay and self.page in ['blob', 'blame']
                button.trigger('click')

            else
              file.find('.btn.codecov').attr('aria-label', 'File not reported to Codecov').text('Not covered')

      if self.page in ['commit', 'compare', 'pull']
        # upate toc-diff-stats
        $('.toc-diff-stats .codecov').append(" (Diff <strong>#{self.ratio(total_hits, total_lines)}%</strong>)</span>")

  toggle_coverage: (e) ->
    if e.shiftKey
      window.location = $(@).attr('data-codecov-url')
    else if $('.codecov.codecov-on:first').length == 0
      $('.codecov').addClass('codecov-on')
      $(@).addClass('selected')
    else
      $('.codecov').removeClass('codecov-on')
      $(@).removeClass('selected')

  toggle_diff: (e) ->
    ###
    CALLED: by user interaction
    GOAL: toggle coverage overlay on diff/compare
    ###
    if e.shiftKey
      window.location = $(@).attr('data-codecov-url')
      return

    file = $(@).parents('.file')
    if $(@).hasClass('selected')
      # disable Codecov
      file.removeClass('codecov-enabled')
      # toggle off
      $(@).removeClass('selected')
      # show deleted lines
      unless $('.diff-table.file-diff-split').length > 0
        file.find('.blob-num-deletion').parent().show()
      # remove covered lines
      file.find('.codecov').removeClass('codecov-on')
    else
      # enable Codecov
      file.addClass('codecov-enabled')
      # toggle on
      $(@).addClass('selected')
      # hide deleted lines
      unless $('.diff-table.file-diff-split').length > 0
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
    else
      $('.btn.codecov').text("Coverage error").attr('aria-label', 'There was an error loading coverage. Sorry')
      $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('aria-label', 'There was an error loading coverage. Sorry')
