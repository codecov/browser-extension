## `v0.5.1`
- [fix] diff to be only lines adjusted
- fix toc overlay to show once

## `v0.5.0`
- [fix] remove background on diff +/- when overlaying coverage
- [ui] show coverage on diffs without toggling
- [feature] added coverage data to toc

## `v0.4.8`
- [feature] added coverage diff to compare/pulls
- [bug] fixes shift click

## `v0.4.7`
- [bug] fix enterprise endpoints

## `v0.4.6`
- [bug] fix issue on Github when no file was found
- [feature] Hold shift key and click on Codecov button to open document in Codecov
- [change] now overlaying all coverage data by default
  - https://github.com/codecov/browser-extension/issues/11
- [firefox] better page detection for injecting scripts
- [firefox] fix enterprise cross domain scriptiing
- [enterprise] Reduced call to codecov.io when not viewing github.com/bitbucket.org

## `v0.4.5`
- [firefox] fixed issue when using Back/Forward button removing page content improperly

## `v0.4.4`
- [bitbucket] updated endpoint for pull-requests
