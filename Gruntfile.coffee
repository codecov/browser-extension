module.exports = (grunt) ->
  grunt.initConfig
    connect:
      test:
        options:
          port: 3000
          hostname: '0.0.0.0'

    coffeecov:
      options:
        path: 'relative'
      dist:
        src: 'src'
        dest: 'lib-cov'

    coffee:
      default:
        expand: yes
        files:
          'dist/github.js': 'src/github.coffee'
        options: bare: yes

    watch:
      coffee:
        files: ['src/*.coffee']
        tasks: 'coffee'
      less:
        files: ['src/*.less']
        tasks: 'less'

    less:
      default:
        files:
          'dist/github.css': 'src/github.less'
        options: compress: yes, cleancss: yes

    curl:
      'test/github/test_pull.html': 'https://github.com/codecov/codecov-python/pull/16'
      'test/github/test_blob.html': 'https://github.com/codecov/codecov-python/blob/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py'
      'test/github/test_blame.html': 'https://github.com/codecov/codecov-python/blame/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py'
      'test/github/test_compare.html': 'https://github.com/codecov/codecov-python/compare/codecov:21dcc07...codecov:4c95614'

    dom_munger:
      all:
        src: 'test/github/*.html'
        options:
          remove: ['link', 'script']
          prepend: {selector:'body',html:'<div id="mocha"></div>'},
          append: {selector:'head',html:'<link rel="stylesheet" href="../mocha.css" /><script src="../mocha.js"></script><script src="../chai.js"></script><script src="../bridge.js"></script><script src="../../dist/jquery-2.1.3.min.js"></script><script src="../deps.js"></script><script src="../../lib-cov/github.js"></script>'}
      blob: {src: 'test/github/test_blob.html', options: {append: {selector:'body',html:'<script>window.codecov_settings = {"debug": "https://github.com/codecov/codecov-python/blob/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py", "callback": mochaRunTests};</script><script src="test_blob.js"></script>'}}}
      pull: {src: 'test/github/test_pull.html', options: {append: {selector:'body',html:'<script>window.codecov_settings = {"debug": "https://github.com/codecov/codecov-python/pull/16", "callback": mochaRunTests};</script><script src="test_pull.js"></script>'}}}
      blame: {src: 'test/github/test_blame.html', options: {append: {selector:'body',html:'<script>window.codecov_settings = {"debug": "https://github.com/codecov/codecov-python/blame/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py", "callback": mochaRunTests};</script><script src="test_blame.js"></script>'}}}
      compare: {src: 'test/github/test_compare.html', options: {append: {selector:'body',html:'<script>window.codecov_settings = {"debug": "https://github.com/codecov/codecov-python/compare/codecov:21dcc07...codecov:4c95614", "callback": mochaRunTests};</script><script src="test_compare.js"></script>'}}}

    mocha:
      all:
        options:
          page:
            settings:
              webSecurityEnabled: no
          mocha:
            ignoreLeaks: no
            globals: ['jQuery*', 'codecov']
          urls: [
            # 'http://localhost:3000/test/github/test_blob.html'
            # 'http://localhost:3000/test/github/test_pull.html'
            'http://localhost:3000/test/github/test_blame.html'
            # 'http://localhost:3000/test/github/test_compare.html'
            ]
          run: no
          reporter: 'mocha-phantom-coverage-reporter'
          timeout: 10000

    clean:
      test: "test/**/*.html"

  grunt.loadNpmTasks 'grunt-curl'
  grunt.loadNpmTasks 'grunt-mocha'
  grunt.loadNpmTasks 'grunt-coffeecov'
  grunt.loadNpmTasks 'grunt-dom-munger'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  grunt.registerTask 'default', ['coffee', 'less']
  grunt.registerTask 'test', ['curl', 'dom_munger', 'runTests', 'clean']
  grunt.registerTask 'runTests', ['coffeecov', 'connect', 'mocha']
