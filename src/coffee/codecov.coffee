window.codecov = (prefs) ->
  if $('meta[content=GitHub]').length > 0
    new Github prefs
