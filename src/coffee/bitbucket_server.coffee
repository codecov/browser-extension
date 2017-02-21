class window.BitbucketServer extends Codecov
  @last_href
  @time_interval
  @diff_view: false
  @sub_page


  getParameterByName: (name, url) ->
    if !url
      url   = window.location.href;

    name    = name.replace(/[\[\]]/g, "\\$&");
    regex   = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
    results = regex.exec(url)
    if results == null
      return null
    if !results[2]
      return ''
    return decodeURIComponent(results[2].replace(/\+/g, " "))

  get_ref: (href) ->
    @log('::get_ref')
    @service = 'bbs'

    if @page is 'browse'
      if $('.commitid').length != 0
        ref = $('.commitid').attr('data-commitid')
      else if $('#repository-layout-revision-selector').length != 0
          json = JSON.parse($('#repository-layout-revision-selector').children().eq(1).attr('data-revision-ref'))
          ref = json.latestCommit
      return ref

    else if @page is 'commits'
      ref = 'branch/master/commits?'

      if href[7] == 'commits' && typeof(href[8]) == 'undefined'
        return ref
    
      else if href[7].indexOf('?') != -1
        @diff_view = false
        commit_href = href[7].split(@page)
        if commit_href[1] != '?merges=include'
          branch_str = @getParameterByName('until', commit_href[1])
          branch_str = branch_str.split('/')
          ref = branch_str[branch_str.length-1]
      else
        @diff_view = true
        if href[8].indexOf('#') != -1
          ref = href[8].split('#')[0]
        else
          ref = href[8]
      return ref

    else if @page is 'pull-requests'
      @sub_page = href[9]
      if @sub_page == 'commits'
        if href[10].indexOf('#') != -1
          return href.split('#')[0]
    no

  load_properties: ->
    @log('::load_properties')

    @last_href = window.location.href
    href = (@settings.debug_url or @last_href).split('/')
    if href
      @slug = "#{href[4]}/#{href[6]}"
      @page = href[7].split('?')[0]
      @ref  = @get_ref href

  update_view: =>
    @log('::update_view')
    @load_properties()
    @_run()
    clearTimeout(@time_interval)
    @time_interval = 0

  send_signal: =>
    @log('::send_signal')
    @time_interval = setTimeout(@update_view, 1500)

  prepare: ->
    @log('::prepare')
    # add Coverage Toggle
    $('.file-toolbar > .secondary').prepend(
        '<div class="aui-buttons"><button class="aui-button codecov" title="'+ "#{@messages.status.pending.title}" +'"> '+"#{@messages.status.pending.text}"+'</button></div>'
     )
    
    yes

  ###
  _get: (endpoint) ->
    if @page is 'commits'
      if @diff_view
        @_process report_commit
        return report_commit
      else
        @_process report_commits
        return report_commits

    else if @page is 'pull-requests'
      return report_commit
    
    @_process report
    return report
  ###

  overlay: (res) ->
    @log('::overlay')
    self = @
    report = res?.commit?.report or res?.head?.report
    filename = ''

    # Commits
    if @page is 'commits'
      if @diff_view
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
            if value == 1
              line =  $('.CodeMirror-code .line:nth-child('+key+')')
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
              .append("""<a class="codecov-on" title="Codecov Coverage" href="#{base_url}/#{commit_data.commitid}">#{self.format commit_data.totals.c}%</Aa>""")

    # Browse
    else if @page is 'browse'
      if $('.file-path').length != 0
        $('.file-path > a').each (index, element) =>
          if $(element).text() != @slug.split('/')[1]
            filename += $(element).text() + '/'
      filename += $('.breadcrumbs').children('.stub').text()

      # File tree view
      $('#browse-table tr').each ->
        if $(@).hasClass('folder')
          return true

        if $(@).children('.codecov-on').length != 0
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

  _start: ->
    @log('::start')
    @bind_id = ''
    @time_interval = 0
    self = @
    @load_properties()

    if @page is 'browse'
      if $('#browse-table').length != 0
        @bind_id = '.filebrowser-content'
      else
        @bind_id = '.content-view'

    else if @page is 'commits'
      if @diff_view
        @bind_id = '.commit-files'
      else
        @bind_id = '#commits-table'

    $(@bind_id).bind("DOMSubtreeModified", ->
      if self.time_interval == 0 and self.diff_view != true
        self.last_href = window.location.href
        self.send_signal()
    )
    @log('::time_interval', @time_interval)
    if @time_interval == 0
      self.send_signal()
    @prepare()
