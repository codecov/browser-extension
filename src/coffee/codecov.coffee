class window.Codecov
  slug: null  # :owner/:repo
  ref: null   # sha of head
  base: ''    # sha of base (compare|pull only)
  file: ''    # specific file name viewing (blob only)
  page: null  # type of github page: blob|compare|pull
  found: no   # was coverage found
  urlid: 0    # which url to use when searching reports
  cache: [null, null]
  settings:
    urls: []
    overlay: true
    debug: no
    callback: null
    debug_url: null

  log: (title, data) -> console.log(@, title, data) if @settings.debug

  constructor: (prefs, cb) ->
    ###
    Called once at start of extension
    ###
    # establish settings
    @settings = $.extend(@settings, prefs)
    urls = []
    # add enterprise urls
    if prefs.enterprise
      urls = prefs.enterprise.split('\n').filter(Boolean)

    href = (@settings.debug_url or document.URL).split('/')
    # only add codecov.io when on production site
    if href[2] in ['github.com', 'bitbucket.org']
      urls.unshift 'https://codecov.io'

    @settings.urls = urls
    # callback to allow custom events for each browser
    cb? @

    # Go
    @_start()

  format: (cov) ->
    # format with your settings
    parseFloat(cov).toFixed(2)

  get_ref: -> # find and return the page ref
  prepare: -> # first prepare the page for coverage overlay
  overlay: -> # method to overlay coverage results

  _start: ->
    ###
    CALLED: when dom changes and page first loads
    GOAL: is to collect page variables, insert dom elements, bind callbacks
    ###
    @log('::start')
    href = (@settings.debug_url or document.URL).split('/')
    @slug = "#{href[3]}/#{href[4]}"
    @page = href[5]
    @ref = @get_ref href
    @log('::ref', @ref)
    if @ref
      @prepare()
      @_run()

  _run: ->
    ###
    CALLED: when coverage should be retrieved.
    GOAL: get coverage from cache -> storage -> URL
    ###
    return if @_processing
    @log('::run')
    self = @
    @cachekey = "#{@slug}/#{@ref}" + (if @base then "/{@base}" else '')

    # get fron storage
    # ----------------
    @_processing = yes
    @storage_get = storage_get
    if @cache[0] == @cachekey
      self.log '::in-memory'
      @_process @cache[1]
    else
      storage_get @cachekey, (result) ->
        if result?
          self.log '::in-cached'
          self._process result
        else
          # run first url
          self._get self.settings.urls[self.urlid]

  _get: (endpoint) ->
    ###
    CALLED: to get the coverage report from Codecov (or Enterprise urls)
    GOAL: http fetch coverage
    ###
    @log('::get', endpoint)
    self = @

    if endpoint is 'https://codecov.io'
      # cc-v4
      url = "#{endpoint}/api/#{@service}/#{@slug}/" + (if @base then "compare/#{@base}...#{@ref}" else "commits/#{@ref}") + "?src=extension"
    else
      # (enterprise) cc-v3
      url = "#{endpoint}/api/#{@service}/#{@slug}?ref=#{@ref}" + (if @base then "&base=#{@base}"  else "") + "?src=extension"

    # get coverage
    # ============
    $.ajax
      url: url
      type: 'get'
      dataType: 'json'
      success: (res) ->
        self.url = endpoint # keep the url that worked
        self.found = yes
        self._process res, yes

      # for testing purposes
      complete: ->
        self.log('::ajax.complete', arguments)
        self.settings?.callback?()

      # try to get coverage data from enterprise urls if any
      error: (xhr, type, reason) ->
        self._processing = no
        self.log(arguments)
        self.error(xhr.status, reason)
        self._get(self.settings.urls[self.urlid+=1]) if self.settings.urls.length > self.urlid+1

  _process: (res, store=no) ->
    ###
    CALLED: to process report data
    GOAL: to update the dom with coverage
    ###
    @_processing = no
    @log('::process', res)
    # cache in extension
    @cache = [@cachekey, res]
    # cache in storage
    if store and @cacheable
      storage_set {"#{@cachekey}": res}, -> null

    try
      @overlay res

    catch error
      console.debug(error)
      @log error
      @error 500, error

  color: (ln) ->
    return if !ln?  # undefined or null
    c = if !ln.c? then ln else ln.c
    if c is 0
      "missed"
    else if c is true
      "partial"
    else if '/' in c
      v = c.split('/')
      if v[0] is '0'
        "missed"
      else if v[0] == v[1]
        "hit"
      else
        "partial"
    else
      "hit"

  ratio: (x, y) ->
    # [todo] respect the yml.coverage.ratio & yml.coverage.round
    if x >= y
      "100"
    else if y > x > 0
      (Math.round( (x / y) * 10000 ) / 100).toFixed(2)
    else
      "0.00"


window.create_codecov_instance = (prefs, cb) ->
  # hide codecov plugin
  document.getElementById('chrome-install-plugin')?.style.display = 'none'
  document.getElementById('opera-install-plugin')?.style.display = 'none'

  # detect git service
  if $('meta[name="hostname"]').length > 0
    new Github prefs, cb

  else if $('meta[name="application-name"]').attr('content') in ['Bitbucket', 'Stash']
    new Bitbucket prefs, cb

  else if 'GitLab' in $('meta[name="description"]').attr('content')
    new Gitlab prefs, cb
