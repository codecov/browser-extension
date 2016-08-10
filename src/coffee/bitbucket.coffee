class window.Bitbucket extends Codecov
  get_ref: (href) ->
    @log('::get_ref')
    @service = if window.location.hostname is 'bitbucket.org' or @settings.debug_url? then 'bb' else 'bbs'

    if @page is 'src'
      return href[6].split('?')[0]

    else if @page is 'commits'
      return href[6].split('?')[0]

    else if @page is 'pull-requests'
      return $('.view-file:first').attr('href')?.split('/')[4]

    no  # overlay available

  prepare: ->
    @log('::prepare')
    # add Coverage Toggle
    $('#editor-container, section.bb-udiff').each ->
      if $('.aui-button.codecov', @).length is 0
        $('.secondary>.aui-buttons:first', @)
          .prepend('''<a href="#" class="aui-button aui-button-light codecov"
                         title="Requesting coverage from Codecov.io">Coverage loading...</a>''')

    yes  # get the coverage

  overlay: (res) ->
    @log('::overlay')
    self = @
    $('.codecov.codecov-removable').remove()

    report = res?.commit?.report or res?.head?.report

    # tree view
    $('#source-list tr td.dirname').attr('colspan', 5)
    $('#source-list tr').each ->
      fp = $('a', @).attr('href')?.split('?')[0].split('/').slice(5).join('/')
      cov = report?.files?[fp]?.t.c
      if cov?
        $('td.size', @)
          .after("""
            <td title="Coverage"
                style="background:linear-gradient(90deg, #{self.bg cov} #{cov}%, white #{cov}%);text-align:right;"
                class="codecov codecov-removable">
              #{self.format cov}%
            </td>""")
      else
        # add empty cell
        $('td.size', @).after("<td style=\"color:#e7e7e7\">n/a</td>")


    # diff file
    $('section.bb-udiff').each ->
      $file = $(@)
      fp = $file.attr('data-path')
      data = report?.files?[fp]
      if data?
        button = $('.aui-button.codecov', @)
                  .attr('title', 'Toggle Codecov')
                  .text("Coverage #{self.format data.t.c}%")
                  .attr('data-codecov-url', "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/src/#{self.ref}/#{fp}")
                  .unbind()
                  .click(self.toggle_diff)

        $('.udiff-line.common, .udiff-line.addition', @)
          .find('a.line-numbers').each ->
            a = $(@)
            ln = a.attr('data-tnum')
            ln = data?.l?[ln]
            if ln? then a.addClass("codecov codecov-#{self.color ln}")

      else
        $file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered')

    # single file
    $("#editor-container").each ->
      $file = $(@)
      fp = $file.attr('data-path')
      # find covered file
      file = report?.files?[fp]
      filename = fp.split('/').pop()
      if file?
        # ... show diff not full file coverage for compare view
        button = $file.find('.aui-button.codecov')
                      .attr('title', 'Toggle Codecov')
                      .text("Coverage #{self.format file.t.c}%")
                      .attr('data-codecov-url', '[TODO]')
                      .unbind()
                      .click(self.toggle_coverage)

        # overlay coverage
        for ln, cov of file['l']
          $("a[name='#{filename}-#{ln}']", $file).addClass("codecov codecov-#{self.color(cov)}")

        # toggle blob/blame
        if self.settings.overlay and self.page in ['src', '']
          button.trigger('click')

      else
        $file.find('.aui-button.codecov')
             .attr('title', 'File coverage not found')
             .attr('data-codecov-url', '[TODO]')
             .text('Not covered')

  toggle_coverage: (e) ->
    e.preventDefault()
    if e.altKey or e.shiftKey
      window.location = $(@).attr('data-codecov-url')

    else if $('.codecov.codecov-on:first').length == 0
      $('.codecov').addClass('codecov-on')
      $(@).addClass('aui-button-light')

    else
      $('.codecov').removeClass('codecov-on')
      $(@).removeClass('aui-button-light')

  error: (status, reason) ->
    if status is 401
      $('.aui-button.codecov').text("Please login at Codecov")
                              .addClass('aui-button-primary')
                              .attr('title', 'Login to view coverage by Codecov')
                              .click -> window.location = "https://codecov.io/login/github?redirect=#{escape window.location.href}"

    else if status is 404
      $('.aui-button.codecov').text("No coverage")
                              .attr('title', 'Coverage not found')
      # $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('No coverage').attr('title', 'Coverage not found')
    else
      $('.aui-button.codecov').text("Coverage error")
                              .attr('title', 'There was an error loading coverage. Sorry')
      # $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('title', 'There was an error loading coverage. Sorry')
