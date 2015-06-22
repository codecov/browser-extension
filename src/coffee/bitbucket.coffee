class window.Bitbucket extends Codecov
  get_ref: (href) ->
    @log('bitbucket.get_ref')
    @service = 'bitbucket'

    if @page is 'src'
      return href[6].split('?')[0]

    else if @page is 'commits'
      return href[6].split('?')[0]

    else if @page is 'pull-request'
      return $('.view-file:first').attr('href')?.split('/')[4]

    no  # overlay available

  prepare: ->
    @log('bitbucket.prepare')
    # add Coverage Toggle
    $('#editor-container, section.bb-udiff').each ->
      if $('.aui-button.codecov', @).length is 0
        $('.secondary>.aui-buttons:first', @).prepend('<a href="#" class="aui-button aui-button-light codecov" title="Requesting coverage from Codecov.io">Coverage loading...</a>')

    yes  # get the coverage

  overlay: (res) ->
    @log('bitbucket.overlay')
    self = @

    # tree view
    $('#source-list tr td.dirname').attr('colspan', 5)
    $('#source-list tr').each ->
      fn = $('a', @).attr('href')?.split('?')[0].split('/').slice(5).join('/')
      coverage = res.report.files[fn]
      unless coverage?.ignored
        cov = coverage?.coverage
        $('td.size', @).after('<td title="Coverage" class="codecov">' + (if cov >= 0 then "#{Math.round cov}%" else '') + "</td>")

    # diff file
    $('section.bb-udiff').each ->
      file = $(@)
      fp = file.attr('data-path')
      coverage = res['report']['files'][fp] or self.find_best_fit_path(fp, res['report']['files'])
      unless coverage?.ignored
        if coverage
          button = $('.aui-button.codecov', @)
                    .attr('title', 'Toggle Codecov')
                    .text('Coverage '+coverage['coverage'].toFixed(0)+'%')
                    .unbind()
                    .click(self.toggle_diff)

          $('.udiff-line.common, .udiff-line.addition', @).find('a.line-numbers').each ->
            a = $(@)
            ln = a.attr('data-tnum')
            cov = coverage.lines?[ln]
            a.addClass("codecov codecov-#{self.color(coverage['lines'][ln])}") if cov?

        else
          file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered')

    # single file
    $("#editor-container").each ->
      file = $(@)
      fp = file.attr('data-path')
      # find covered file
      coverage = res['report']['files'][fp] or self.find_best_fit_path(fp, res['report']['files'])
      unless coverage?.ignored
        # report coverage
        if coverage
          # ... show diff not full file coverage for compare view
          button = file.find('.aui-button.codecov')
                       .attr('title', 'Toggle Codecov')
                       .text('Coverage '+coverage['coverage'].toFixed(0)+'%')
                       .unbind()
                       .click(self.toggle_coverage)

          # overlay coverage
          $("a[name=cl-#{ln}]", file).addClass("codecov codecov-#{self.color(cov)}") for ln, cov of coverage['lines']

          # toggle blob/blame
          if self.page in ['src', '']
            button.trigger('click') for _ in self.settings.first_view

        else
          file.find('.aui-button.codecov').attr('title', 'File coverage not found').text('Not covered')

  toggle_coverage: (event) ->
    event.preventDefault()
    if $('a.codecov.codecov-hit.codecov-on').length > 0
      # toggle hits off
      $('a.codecov.codecov-hit').removeClass('codecov-on')
    else if $('a.codecov.codecov-on').length > 0
      # toggle all off
      $('a.codecov').removeClass('codecov-on')
      $(@).removeClass('aui-button-light')
    else
      # toggle all on
      $('a.codecov').addClass('codecov-on')
      $(@).addClass('aui-button-light')

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
    else if status is 500
      $('.aui-button.codecov').text("Coverage error")
                              .attr('title', 'There was an error loading coverage. Sorry')
      # $('.commit.codecov .sha-block').addClass('tooltipped tooltipped-n').text('Coverage Error').attr('title', 'There was an error loading coverage. Sorry')
