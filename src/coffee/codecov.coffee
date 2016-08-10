class window.Codecov
  slug: null  # :owner/:repo
  ref: null   # sha of head
  base: ''    # sha of base (compare|pull only)
  file: ''    # specific file name viewing (blob only)
  page: null  # type of github page: blob|compare|pull
  found: no   # was coverage found
  urlid: 0    # which url to use when searching reports
  cache: [null, null]
  colors: ['#f8d9d3', '#f8d9d3', '#f8d9d3', '#f9dad2', '#f9dad2', '#fadad1',
           '#fadad1', '#fadad1', '#fbdbd0', '#fbdbd0', '#fbdbd0', '#fcdbcf',
           '#fcdccf', '#fddcce', '#fddcce', '#fdddce', '#feddcd', '#feddcd',
           '#fedecd', '#ffdecc', '#ffdecc', '#ffdfcc', '#fee0cd', '#fee2cd',
           '#fee3cd', '#fee4cd', '#fde5ce', '#fde6ce', '#fde7ce', '#fde8ce',
           '#fce9cf', '#fceacf', '#fcebcf', '#fceccf', '#fbedd0', '#fbeed0',
           '#fbefd0', '#fbefd0', '#faf0d1', '#faf1d1', '#faf1d1', '#faf2d1',
           '#faf2d1', '#faf2d1', '#faf3d1', '#f9f3d2', '#f9f4d2', '#f9f4d2',
           '#f9f4d2', '#f9f5d2', '#f9f5d2', '#f9f5d2', '#f8f6d3', '#f8f6d3',
           '#f8f6d3', '#f8f7d3', '#f8f7d3', '#f8f7d3', '#f7f8d3', '#f7f7d4',
           '#f7f7d4', '#f7f8d3', '#f7f8d3', '#f7f9d2', '#f6f9d2', '#f6f9d2',
           '#f6fad1', '#f6fad1', '#f6fbd0', '#f6fbd0', '#f5fbd0', '#f5fccf',
           '#f5fccf', '#f4fdce', '#f4fdce', '#f4fdce', '#f3fecd', '#f3fecd',
           '#f3ffcc', '#f2ffcc', '#f2ffcc', '#f1ffcc', '#f0ffcc', '#eefecd',
           '#edfecd', '#ecfecd', '#ebfecd', '#e9fecd', '#e8fdce', '#e7fdce',
           '#e6fdce', '#e5fdce', '#e4fdce', '#e3fccf', '#e2fccf', '#e1fccf',
           '#e0fccf', '#dffccf', '#defbd0', '#ddfbd0', '#dcfbd0']
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

  get_ref: -> # find and return the page ref
  prepare: -> # first prepare the page for coverage overlay
  overlay: -> # method to overlay coverage results
  get_codecov_yml: ->  # return yaml source code if viewing it in GH

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
    @cachekey = "#{@slug}/#{@ref}" + (if @base then "/#{@base}" else '')

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

    if '/' in @ref
      url = "#{endpoint}/api/#{@service}/#{@slug}/#{@ref}&src=extension"
    else
      e = if @base then "compare/#{@base}...#{@ref}" else "commits/#{@ref}"
      url = "#{endpoint}/api/#{@service}/#{@slug}/#{e}?src=extension"

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
        self._validate_codecov_yml()

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

    @yaml =
      round: res.repo?.yaml?.coverage?.round? || 'down'
      precision: if res.repo?.yaml?.coverage?.precision? then res.repo.yaml.coverage.precision else 2
      range: [
        parseFloat(if res.repo?.yaml?.coverage?.range? then res.repo.yaml.coverage.range[0] else 70),
        parseFloat(if res.repo?.yaml?.coverage?.range? then res.repo.yaml.coverage.range[1] else 100)
      ]

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

  bg: (coverage) ->
    coverage = parseFloat coverage
    if coverage <= @yaml.range[0]
      @colors[0]
    else if coverage >= @yaml.range[1]
      @colors[100]
    else
      @colors[parseInt(((coverage - @yaml.range[0]) / (@yaml.range[1] - @yaml.range[0])) * 100)]

  ratio: (x, y) ->
    if x >= y
      "100"
    else if y > x > 0
      @format (Math.round( (x / y) * 10000 ) / 100)
    else
      "0"

  format: (cov) ->
    cov = parseFloat(cov)
    if @yaml.round is 'up'
        _ = parseFloat(Math.pow(10, @yaml.precision))
        c = (Math.ceil(cov * _) / _)
    else if @yaml.round is 'down'
        _ = parseFloat(Math.pow(10, @yaml.precision))
        c = (Math.floor(cov * _) / _)
    else
        c = Math.round(cov, @yaml.precision)

    cov.toFixed(@yaml.precision)

  _validate_codecov_yml: ->
    self = @
    yml = self.get_codecov_yml()
    if yml
      $.ajax
        url: "#{self.settings.urls[self.urlid]}/validate"
        type: 'post'
        data: yml
        success: self.yaml_ok
        error: (xhr, type, reason) -> self.yml_error(reason)

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
