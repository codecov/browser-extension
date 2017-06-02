class window.BitbucketServer extends Codecov
  ref:''           # sha of head
  href: ''         # Page url
  sub_page: ''     # E.g.: pull-requests/diff
  timeout: 1500    # Timeout time in ms, for UI updates
  time_interval: 0 # Timeout function
  service: 'bbs'   # BBS

  getParameterByName: (name, url) ->
    if !url
      url   = window.location.href
    name    = name.replace(/[\[\]]/g, "\\$&")
    regex   = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
    results = regex.exec(url)
    if results == null
      return null
    if !results[2]
      return ''
    return decodeURIComponent(results[2].replace(/\+/g, " "))

  bbs_rest_request: (rest_path, callback) ->
    url = "#{window.location.protocol}//#{window.location.host}/rest/api/latest/#{rest_path}"
    @log('::bbs_rest_request', url)
    $.ajax
      url: url
      success: (res) ->
        callback res
      error: (xhr, type, reason) ->
        self.error(xhr.status, reason)

  refresh_href: ->
    @log('::refresh_href')
    href = (@settings.debug_url or window.location.href).split('/')
    if href != @href
      @base = ''
      @ref  = ''
      @href = href
      @parse_href()
      return yes
    return no

  get_ref: (href) ->
    @log('::get_ref')
    self = @

    switch @page
      when 'browse'
        if $('.commitid').length != 0
          @ref = $('.commitid').attr('data-commitid')
        else if $('#repository-layout-revision-selector').length != 0
          json = JSON.parse $('#repository-layout-revision-selector').children().eq(1).attr('data-revision-ref')
          @ref = json.latestCommit
      when 'commits'
        ref = 'branch/master/commits?'
        if href[7] == 'commits' && typeof(href[8]) == 'undefined'
          @ref = ref
        else if href[7].indexOf('?') != -1
          commit_href = href[7].split(@page)
          if commit_href[1] != '?merges=include'
            branch_str = @getParameterByName('until', commit_href[1])
            branch_str = branch_str.split('/')
            @ref = branch_str[branch_str.length-1]
        else
          if href[8].indexOf('#') != -1
            @ref = href[8].split('#')[0]
          else
            @ref = href[8]
      when 'pull-requests'
        if @sub_page is 'commits' and @href[@href.length - 1] is 'commits'
          # commits overview table
          if $('.branch_name').length > 0
            @ref = $($('.branch_name')[0]).text()
    no

  update_view: =>
    @log('::update_view')
    self = @
    href_changed = @refresh_href()
    if href_changed
      if @page == 'pull-requests' and @href[@href.length - 1] != 'commits'
          rest_path = "#{@href.slice(3,9).join('/')}/commits"
          @bbs_rest_request(rest_path, (response) ->
            if self.sub_page == 'diff'
              self.ref  = response.values[0].id
              self.base = response.values[0].parents[0].id
            else if self.sub_page == 'commits'
              if self.href[10].indexOf('#') != -1
                self.ref = self.href[10].split('#')[0]
              else
                self.ref = self.href[10]
              commit_obj = $.grep(response.values, (e) -> return e.id == self.ref)
              if commit_obj.length
                self.base = commit_obj[0].parents[0].id
            self._run()
          )
      else
        @get_ref @href
        @_run()
    clearTimeout(@time_interval)
    @time_interval = 0

  send_signal: =>
    @log('::send_signal')
    @time_interval = setTimeout(@update_view, @timeout)
  
  register_bind_id: (bind_id) ->
    self = @
    $(bind_id).bind("DOMSubtreeModified", ->
      if self.time_interval == 0
        self.send_signal()
    )

  parse_href: ->
    @log('::parse_href')
    @slug = "#{@href[4]}/#{@href[6]}"
    @page = @href[7].split('?')[0]
    if @page == 'pull-requests' and @href.length >= 9
      @sub_page = @href[9]

    ###
    switch @page
      when 'pull-requests'
        if @href.length < 9
          @register_bind_id('.pull-request-list')
        else
          @register_bind_id('.tabs-menu')
          if @sub_page in ['diff', 'commits'] and @href[@href.length] != 'commits'
            @register_bind_id('.file-tree-wrapper')
      when 'browse'
        if $('#browse-table').length != 0
          @register_bind_id('.filebrowser-content')
        else
          @register_bind_id('.content-view')
      when 'commits'
        if @href.length > 8 and @href[8].indexOf('#') == -1
          @register_bind_id('.commit-files')
        else
          @register_bind_id('#commits-table')
     ###

  prepare: ->
    self = @
    @log('::prepare')
    @refresh_href()

    switch @page
      when 'browse'
        if $('.file-content').length != 0
          $('.file-toolbar > .secondary').prepend(
            '<div class="aui-buttons"><button class="aui-button codecov-button" title="Toggle coverage from codecov"> Coverage </button></div>'
          )
        else if $('.filebrowser-content').length != 0
          $('.aui-toolbar2-secondary > .aui-buttons').append(
            '<button class="aui-button codecov-button" title="Toggle coverage from codecov"> Coverage </button>'
          )
      when 'commits'
        if $('.commits-table').length != 0
          $('.aui-toolbar2-secondary').append(
            '<div class="aui-buttons"><button class="aui-button codecov-button" title="Toggle coverage from codecov"> Coverage </button></div>'
          )
        else if $('.file-content').length != 0
          setTimeout ->
            $('#commit-file-content > .file-toolbar > .secondary').prepend(
              '<button class="aui-button codecov-button" title="Toggle coverage from codecov"> Coverage </button>'
            )
            $('.codecov-button').on 'click', ->
              self.update_view()
          , 1000
      when 'pull-requests'
        $('.tabs-menu').append('<button class="aui-button codecov-button" style="float:right; border-bottom:0; border-radius:0" title="Toggle coverage from codecov"> Coverage </button>')
    $('.codecov-button').on 'click', ->
      self.update_view()
    yes

  # Views

  # Browse/src view
  browse_view: (res) ->
    @log('::browse_view', res)
    self = @
    report = res?.commit?.report or res?.head?.report
    filename = ''

    if $('.file-path').length != 0
      $('.file-path > a').each (index, element) =>
        if $(element).text() != @slug.split('/')[1]
          filename += $(element).text() + '/'
      filename += $('.breadcrumbs').children('.stub').text()

    if $('#browse-table tr').length > 0
      # File tree view
      $('#browse-table tr').each ->
        if $(@).hasClass('folder') or $(@).children('.codecov-on').length != 0
          return true

        filename += "/#{$(@).find('td.item-name').children('a').text()}"
        cov = report?.files?[filename]?.t.c
        if cov?
          $(@)
            .append("""
              <td class="codecov-on" title="Coverage"
                  style="background:linear-gradient(90deg, #{self.bg cov} #{cov}%, white #{cov}%);text-align:right;"
                  class="codecov codecov-removable">
                #{self.format cov}%
              </td>""")
        else
          # add empty cell
          $(@).append("<td class=\"codecov-on\" style=\"color:#e7e7e7\">n/a</td>")

    # Single file view
    cov = report?.files?[filename]
    @log('::filename is', filename)

    if cov?
      button = $('.aui-button.codecov')
                 .attr('title', 'Toggle Codecov')
                 .text("Coverage #{self.format cov.t.c}%")
                 .attr('data-codecov-url', "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/src/#{self.ref}/#{filename}")

      $(button).on('click', ->
        self.update_view()
       )

      for key, value of cov['l']
        line =  $('.CodeMirror-code .line:nth-child('+key+')')
        line.addClass("codecov codecov-#{self.color(value)}")

  # Commits
  commits_view: (res) ->
    @log('::commits_view', res)
    self = @
    report = res?.commit?.report or res?.head?.report
    filename = ''

    if $('#commits-table').length == 0
      # Single commit diff view
      $('.file-path > span').each (index, element) ->
        filename += $(element).text()
      filename += "/#{$('.breadcrumbs').children('.stub').text()}"
      cov = report?.files?[filename]
      if cov?
        coverage_url = "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/src/#{self.ref}/#{filename}"
        button = $('.aui-button.codecov')
                    .attr('title', 'Toggle Codecov')
                    .text("Coverage #{self.format cov.t.c}%")
                    .attr('data-codecov-url', coverage_url)

        for key, value of cov['l']
          line =  $('.side-by-side-diff-editor-to').find('.CodeMirror-code .line:nth-child('+key+')')
          line.children('.CodeMirror-gutter-wrapper').find('.line-number').addClass("codecov codecov-#{self.color(value)}")

    else
      # List view, all commits
      commits = {}
      for c in res.commits
        commits[c.commitid] = c
      base_url = "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/commit"
      $('#commits-table tr').each ->
        commit  = $ @
        if commit.find('.message').children('.codecov-on').length > 0
          return true
        commitid = commit.attr('data-commitid')
        commit_data  = commits[commitid]

        if commit_data?.totals?.c?
          commit
            .find('.message')
            .append("""<a style="float:right;" class="codecov-on" title="Codecov Coverage" href="#{base_url}/#{commit_data.commitid}">#{self.format commit_data.totals.c}%</Aa>""")


  # Pull requests
  pr_view: (res) =>
    @log('::pr_view', res)
    self = @
    filename = ''
    if @sub_page
      # Specific pull request
      switch @sub_page
        when 'overview'
          0
        when 'diff'
          report = res.head.report
          # TODO: Used multiple times with different views, consider a seperate function
          $('.file-path > span').each (index, element) ->
            filename += $(element).text()
          filename += "/#{$('.breadcrumbs').children('.stub').text()}"
          cov = report.files[filename]
          for key, value of cov.l
            line =  $('.side-by-side-diff-editor-to').find('.CodeMirror-code .line:nth-child('+key+')')
            line.children('.CodeMirror-gutter-wrapper').find('.line-number').addClass("codecov codecov-#{self.color(value)}")
        when 'commits'
          if @href[@href.length - 1] is 'commits'
            # TODO: This is identical to commits/commits table expect for the id of the table
            # List view, all commits
            commits = {}
            for c in res.commits
              commits[c.commitid] = c
            base_url = "#{@settings.urls[@urlid]}/#{@service}/#{@slug}/commit"
            $('#pull-request-commits-table tr').each ->
              commit  = $ @
              if commit.find('.message').children('.codecov-on').length > 0
                return true
              commitid = commit.attr('data-commitid')
              commit_data  = commits[commitid]
              if commit_data?.totals?.c?
                commit
                  .find('.message')
                  .append("""<a style="float:right;" class="codecov-on" title="Codecov Coverage" href="#{base_url}/#{commit_data.commitid}">#{self.format commit_data.totals.c}%</Aa>""")
          else
            report = res.head.report
            # TODO: Used multiple times with different views, consider a seperate function
            $('.file-path > span').each (index, element) ->
              filename += $(element).text()
            filename += "/#{$('.breadcrumbs').children('.stub').text()}"
            cov = report.files[filename]
            for key, value of cov.l
              line =  $('.side-by-side-diff-editor-to').find('.CodeMirror-code .line:nth-child('+key+')')
              line.children('.CodeMirror-gutter-wrapper').find('.line-number').addClass("codecov codecov-#{self.color(value)}")
    else
      # All pull requests overview
      if $('.pull-requests-table').length > 0
        base_url = "#{self.settings.urls[self.urlid]}/#{self.service}/#{self.slug}/pull-request"
        pulls = {}
        for pull in res.pulls
          pulls[pull.pullid] = pull
        $('.pull-requests-table tr').each (index,element) ->
          summary = $ @.children('.summary')
          pullid  = summary.attr('data-pull-request-id')
          line    = summary.children('.pr-author-number-and-timestamp')
          if line.children('.codecov-on').length > 0
            return true
          else
            line.append("""<a class="codecov-on" title="Codecov Coverage" href="#{base_url}/#{pullid}">#{self.format pulls.pullid.totals.c}%</Aa>""")


  overlay: (res) ->
    @log('::overlay')

    # Commits
    if @page is 'commits'
      @commits_view(res)

    # Browse
    else if @page is 'browse'
      @browse_view(res)

    else if @page is 'pull-requests'
      @pr_view(res)

  _start: ->
    @log('::start')
    @prepare()

  error: (status, reason) ->
    if status is 401
      $('.aui-button.codecov').text("Please login at Codecov")
                              .addClass('aui-button-primary')
                              .attr('title', 'Login to view coverage by Codecov')
                              .click -> window.location = ""

    else if status is 404
      $('.aui-button.codecov').text("No coverage")
                              .attr('title', 'Coverage not found')
    else
      $('.aui-button.codecov').text("Coverage error")
                              .attr('title', 'There was an error loading coverage. Sorry')
