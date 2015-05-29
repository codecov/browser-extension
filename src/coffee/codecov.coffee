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
    first_view: 'im'
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
    @settings.urls = [] unless @settings.urls
    @settings.urls.unshift 'https://codecov.io'

    # callback to allow custom events for each browser
    cb? @

    # Go
    @_start()

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
      url: "#{endpoint}/#{@service}/#{@slug}?ref=#{@ref}#{@base}"
      type: 'get'
      dataType: 'json'
      headers: Accept: 'application/json'
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
        self.log(arguments)
        self._get(self.settings.urls[self.urlid+=1]) if self.settings.urls.length > self.urlid+1
        self.error(xhr.status, reason) unless self.found

  _process: (res, store=no) ->
    ###
    CALLED: to process report data
    GOAL: to update the dom with coverage
    ###
    @_processing = no
    @log('::process')
    slugref = "#{@slug}/#{@ref}"
    # cache in extension
    @cache = [slugref, res]
    # cache in storage
    if store and @cacheable
      storage_set {slugref: res}, -> null

    @overlay(res)

  find_best_fit_path: (fp, files) ->
    matches = [path for path of files when path[fp.length*-1..] is fp or fp[path.length*-1..] is path]
    files[Math.max(matches)] if matches.length > 0

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
