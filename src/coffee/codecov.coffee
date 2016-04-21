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
    slugref = "#{self.slug}/#{self.ref}"

    # get fron storage
    # ----------------
    @_processing = yes
    if @cache[0] == slugref
      self.log('process(cache)')
      @_process @cache[1]
    else
      storage_get slugref, (res) ->
        if res?[self.ref]
          self.log('process(storage)', res[self.ref])
          self._process res[self.ref]
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
    # get coverage
    # ============
    $.ajax
      url: "#{endpoint}/api/#{@service}/#{@slug}?ref=#{@ref}#{@base}"
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
    slugref = "#{@slug}/#{@ref}"
    # cache in extension
    @cache = [slugref, res]
    # cache in storage
    if store and @cacheable
      storage_set {slugref: res}, -> null

    try
      @overlay res
    catch error
      @log error
      @error 500, error

  color: (ln) ->
    if ln is 0
      "missed"
    else if not ln
      null
    else if ln is true
      "partial"
    else if ln instanceof Array
      h = $.grep(ln, (p) -> p[2]>0).length > 0
      m = $.grep(ln, (p) -> p[2]==0).length > 0
      if h and m then "partial" else if h then "hit" else "missed"
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

  ratio: (x, y) ->
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
