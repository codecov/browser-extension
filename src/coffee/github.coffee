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

    else if @page is 'commits'
      # https://github.com/codecov/codecov-python/commits
      # https://github.com/codecov/codecov-python/commits/master
      to = $('li.commit:first a:last').attr('href').split('/')[4]
      from = $('li.commit:last a:last').attr('href').split('/')[4]
      return "branch/#{href[6] or $('.branch-select-menu .js-select-button').text()}/commits?start=#{from}&stop=#{to}"

    else if href[7] is 'commits'
      # https://github.com/codecov/codecov.io/pull/213/commits
      @page = 'commits'
      to = $('li.commit:first a:last').attr('href').split('/')[4]
      from = $('li.commit:last a:last').attr('href').split('/')[4]
      return "pull/#{href[6]}/commits?start=#{from}&stop=#{to}"

    else if @page in ['blob', 'blame']
      # https://github.com/codecov/codecov-python/blob/master/codecov/clover.py
      # https://github.com/codecov/codecov-python/blob/4c95614d2aa78a74171f81fc4bf2c16a6d8b1cb5/codecov/clover.py
      split = $('a[data-hotkey=y]').attr('href').split('/')
      @file = "#{split[5..].join('/')}"
      return split[4]

    else if @page is 'compare'
      # https://github.com/codecov/codecov-python/compare/v1.1.5...v1.1.6
      @base = "#{$('.commit-id:first').text() || $('input[name=comparison_start_oid]').val()}"
      return $('.commit-id:last').text() || $('input[name=comparison_end_oid]').val()

    else if @page is 'pull'
      # https://github.com/codecov/codecov-python/pull/16/files
      @base = "#{$('.commit-id:first').text() || $('input[name=comparison_start_oid]').val()}"
      return $('.commit-id:last').text() || $('input[name=comparison_end_oid]').val()

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
          file
            .find('.file-actions a:first')
            .wrap('<div class="btn-group"></div>')
        file
          .find('.file-actions > .btn-group')
          .prepend("""<a class="btn btn-sm codecov disabled tooltipped tooltipped-n"
                         aria-label="Requesting coverage from Codecov.io"
                         data-hotkey="c">Coverage loading...</a>""")

    yes  # get content to overlay

  overlay: (res) ->
    @log('::overlay')
    self = @
    $('.codecov-removable').remove()

    if @page is 'commits'

      commits = {}
      for c in res.commits
        commits[c.commitid] = c

      base_url = "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/commit"
      $('li.commit').each ->
        $commit = $ @
        commit = commits[$commit.find('a:last').attr('href').split('/')[4]]
        console.log $commit.find('a:last').attr('href').split('/')[4], commit
        if commit?.totals?.c?
          $commit
            .find('.commit-meta.commit-author-section')
            .append("""<a title="Codecov Coverage" href="#{base_url}/#{commit.commitid}">#{self.format commit.totals.c}%</a>""")

    else
      # v4/commits or v4/compare or v3/commit&compare
      report = res.commit?.report or res.head?.report or res.report

      if @page is 'tree'
        total = if report.totals?.c? then report.totals.c else report.coverage  # v4 || v3
        $('.commit-tease span.right').append("""
          <a href="#{@settings.urls[@urlid]}/github/#{@slug}?ref=#{@ref}"
             class="sha-block codecov codecov-removable tooltipped tooltipped-n"
             aria-label="Codecov Coverage">
            #{self.format total}%
          </a>""")
        $('.file-wrap tr:not(.warning):not(.up-tree)').each ->
          filepath = $('td.content a', @).attr('href')?.split('/')[5..].join('/')
          if filepath
            file = report.files?[filepath]
            if file?
              return if file?.ignored  # v4 or (v3)
              cov = if file.t?.c? then file.t.c else file.coverage  # v4 || v3
              if cov?
                path = if file.t?.c? then "src/#{self.ref}/#{filepath}" else "#{filepath}?ref=#{self.ref}"  # v4 || v3
                $('td:last', @).after("""
                <td style="background:linear-gradient(90deg, #{self.bg cov} #{cov}%, white #{cov}%);text-align:right;"
                    class="sha codecov codecov-removable tooltipped tooltipped-n"
                    aria-label="Codecov Coverage">
                  <a href="#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/#{path}">
                    #{self.format cov}%
                  </a>
                </td>""")
              else
                $('td:last', @).after("<td></td>")
            else
              $('td:last', @).after("<td></td>")
          else
            $('td:last', @).after("<td></td>")

      else
        if @page in ['commit', 'compare', 'pull']
          if res.base?
            if report.totals.c?  # v4
              total = report.totals.c
              if res.base?.report?.totals?.c
                compare = self.format(parseFloat(total) - parseFloat(res.base.report.totals.c))
              else
                total = if report.totals.c? then report.totals.c else report.coverage  # v4 || v3
                $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat')
                  .append("""<span class="codecov codecov-removable"> <strong>#{self.format total}%</strong></span>""")
            else  # v3
              total = report.coverage
              compare = self.format(parseFloat(total) - parseFloat(res.base))
            plus = if compare > 0 then '+' else ''
            $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat')
              .append(
                if compare is '0.00'
                  """<span class="codecov codecov-removable">Coverage did not change.</span>"""
                else
                  """<span class="codecov codecov-removable"> <strong>#{plus}#{compare}%</strong></span>"""
              )
          else
            total = if report.totals.c? then report.totals.c else report.coverage  # v4 || v3
            $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat')
              .append("""<span class="codecov codecov-removable"> <strong>#{self.format total}%</strong></span>""")

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
            fp = fp.split('→')[1].trim() if '→' in fp
            file_data = report.files[fp]

            # assure button group
            if file.find('.file-actions > .btn-group').length is 0
              file
                .find('.file-actions a:first')
                .wrap('<div class="btn-group"></div>')

            # report coverage
            # ===============
            if file_data? and file_data?.ignored isnt true
              total = self.format(if file_data.t?.c? then file_data.t.c else file_data.coverage)
              button = file.find('.btn.codecov')
                           .attr('aria-label', 'Toggle Codecov (c), alt+click to open in Codecov')
                           .attr('data-codecov-url',
                               "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/" + (
                                 if file_data.t?.c?  # v4
                                   "src/#{self.ref}/#{fp}"
                                 else  # v3
                                   "#{fp}?ref=#{self.ref}"
                               )
                            )
                           .text("#{total}%")
                           .removeClass('disabled')
                           .unbind()
                           .click(if self.page in ['blob', 'blame'] then self.toggle_coverage else self.toggle_diff)

              # overlay coverage
              hits = 0
              lines = 0
              file_lines = if file_data.l? then file_data.l else file_data.lines
              file.find('tr').each ->
                td = $(_td, @)
                cov = self.color file_lines[td.attr('data-line-number') or (td.attr('id')?[1..])]
                if cov
                  if split_view
                    # only add codecov classes on last two columns
                    $('td:eq(2), td:eq(3)', @)
                      .removeClass('codecov-hit codecov-missed codecov-partial')
                      .addClass("codecov codecov-#{cov}")
                  else
                    $('td', @)
                      .removeClass('codecov-hit codecov-missed codecov-partial')
                      .addClass("codecov codecov-#{cov}")

                  if $('.blob-num-addition', @).length > 0
                    lines += 1
                    hits += 1 if cov is 'hit'

              total_hits += hits
              total_lines += lines

              if self.page in ['commit', 'compare', 'pull']
                diff = self.format self.ratio hits, lines
                button.text("Coverage #{total}% (Diff #{diff}%)")
                # pull view
                if self.page is 'pull'
                  $('a[href="#'+file.prev().attr('name')+'"] .diffstat')
                    .prepend("""<span class="codecov codecov-removable">#{total}% <strong>(#{diff}%)</strong></span>""")
                else
                  # compare view
                  $('a[href="#'+file.prev().attr('name')+'"]')
                    .parent()
                    .find('.diffstat')
                    .prepend("""<span class="codecov codecov-removable">#{total}% <strong>(#{diff}%)</strong></span>""")

              # toggle blob/blame
              if self.settings.overlay and self.page in ['blob', 'blame']
                button.trigger('click')
            else if file_data?.ignored is true  # v3
              file
                .find('.btn.codecov')
                .attr('aria-label', 'File ignored')
                .text('Not covered')
            else
              file
                .find('.btn.codecov')
                .attr('aria-label', 'File not reported to Codecov')
                .text('Not covered')

        if self.page in ['commit', 'compare', 'pull']
          # upate toc-diff-stats
          $('.toc-diff-stats, .diffbar-item.diffstat, #diffstat')
            .find('.codecov')
            .append(" (Diff <strong>#{self.ratio(total_hits, total_lines)}%</strong>)</span>")

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
    if e.altKey
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
      $('.btn.codecov')
        .text("Please login at Codecov")
        .addClass('danger')
        .attr('aria-label', 'Login to view coverage by Codecov')
        .click ->
          window.location = "#{self.settings.urls[self.urlid]}/login/github?redirect=#{escape window.location.href}"
      $('.commit.codecov .sha-block')
        .addClass('tooltipped tooltipped-n')
        .text('Please login into Codecov')
        .attr('aria-label', 'Login to view coverage by Codecov')
        .click ->
          window.location = "#{self.settings.urls[self.urlid]}/login/github?redirect=#{escape window.location.href}"

    else if status is 404
      $('.btn.codecov')
        .text("No coverage")
        .attr('aria-label', 'Coverage not found')
      $('.commit.codecov .sha-block')
        .addClass('tooltipped tooltipped-n')
        .text('No coverage')
        .attr('aria-label', 'Coverage not found')

    else
      $('.btn.codecov')
        .text("Coverage error")
        .attr('aria-label', 'There was an error loading coverage. Sorry')
      $('.commit.codecov .sha-block')
        .addClass('tooltipped tooltipped-n')
        .text('Coverage Error')
        .attr('aria-label', 'There was an error loading coverage. Sorry')
