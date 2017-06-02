require('dotenv').config()
os = require('os')
auth_config = 
  username: process.env.AUTH_USER
  password: process.env.AUTH_PASSWORD

module.exports = (grunt) ->
  grunt.initConfig

    # ----------
    # Processing
    # ----------
    less:
      default:
        files: 'lib/codecov.css': 'src/less/*.less'
        options: compress: yes, cleancss: yes

    coffeecov:
      options:
        path: 'relative'
      dist:
        src: 'src/coffee'
        dest: 'lib-cov'

    coffee:
      default:
        expand: yes
        files: 'lib/codecov.js': [
          'src/coffee/codecov.coffee'
          'src/coffee/github.coffee'
          'src/coffee/bitbucket.coffee'
          'src/coffee/bitbucket_server.coffee'
          'src/coffee/gitlab.coffee'
        ]
        options: bare: yes

    watch:
      all:
        files: ['src/**/*']
        tasks: 'build'

    # --------
    # Building
    # --------

    clean: ['tmp', 'test/**/*.html']

    copy:
      chrome:
        files: [
          {expand: yes, flatten: yes, src: ['icons/*'], dest: 'tmp/chrome/icons/', filter: 'isFile'}
          {expand: yes, flatten: yes, src: ['lib/*'], dest: 'tmp/chrome/lib'}
          {expand: yes, flatten: yes, src: ['src/chrome/options.*'], dest: 'tmp/chrome/lib'}
          {expand: yes, flatten: yes, src: ['src/chrome/listener.js'], dest: 'tmp/chrome/lib'}
          {expand: yes, flatten: yes, src: ['src/chrome/manifest.json'], dest: './tmp/chrome/'}
        ]
      firefox:
        files: [
          {expand: yes, flatten: yes, src: ['icons/*'], dest: 'tmp/firefox/data/icons/', filter: 'isFile'}
          {expand: yes, flatten: yes, src: ['lib/jquery-2.1.3.min.js', 'lib/codecov.js', 'lib/codecov.css'], dest: 'tmp/firefox/data'}
          {expand: yes, flatten: yes, src: ['src/firefox/index.js'], dest: 'tmp/firefox'}
          {expand: yes, flatten: yes, src: ['src/firefox/package.json'], dest: './tmp/firefox/'}
        ]
      safari:
        files: [
          {expand: yes, flatten: yes, src: ['icons/*'], dest: 'tmp/safari/codecov.safariextension/icons', filter: 'isFile'}
          {expand: yes, flatten: yes, src: ['lib/jquery-2.1.3.min.js', 'lib/codecov.js', 'lib/codecov.css'], dest: 'tmp/safari/codecov.safariextension'}
        ]

    concat:
      chrome:
        files: 'tmp/chrome/lib/codecov.js': ['src/chrome/chrome.js', 'tmp/chrome/lib/codecov.js']
      firefox:
        files: 'tmp/firefox/data/codecov.js': ['src/firefox/firefox.js', 'tmp/firefox/data/codecov.js']
      safari:
        files: 'tmp/safari/codecov.safariextension/codecov.js': ['src/safari/safari.js', 'tmp/safari/codecov.safariextension/codecov.js']

    shell:
      chrome:
        command: [
          'cd tmp/chrome && zip -r ../../dist/chrome.zip .'
        ]
      firefox:
        command: [
          'cd tmp/firefox'
          '../../node_modules/jpm/bin/jpm xpi'
          'mv hello@codecov.io-1.0.9.xpi ../../dist/firefox.xpi'
          ].join(' && ')
      opera:
        command: 'cp dist/chrome.crx dist/opera.nex'

    # -------
    # Testing
    # -------
    connect:
      test:
        options:
          port: 3000
          hostname: '0.0.0.0'
      coverage:
        options:
          port: 4000
          hostname: '0.0.0.0'
          middleware: [
            (req, res, next) ->
              fs = require('fs')
              try fs.mkdirSync('coverage')
              try fs.mkdirSync("coverage/#{req.url[1..]}")
              req.on 'data', (json) ->
                fs.writeFileSync("coverage/#{req.url[1..]}/coverage.json", json.toString())
          ]

    curl:
      # Github
      'test/github/test_pull.html': 'https://github.com/codecov/codecov-python/pull/16/files'
      'test/github/test_blob.html': 'https://github.com/codecov/codecov-python/blob/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py'
      'test/github/test_tree.html': 'https://github.com/codecov/codecov-python/tree/097f692a0f02649a80de6c98749ca32a126223fc/codecov'
      'test/github/test_blame.html': 'https://github.com/codecov/codecov-python/blame/097f692a0f02649a80de6c98749ca32a126223fc/codecov/clover.py'
      'test/github/test_compare.html': 'https://github.com/codecov/codecov-python/compare/codecov:21dcc07...codecov:4c95614'
      'test/github/test_compare_split.html': 'https://github.com/codecov/codecov-python/compare/codecov:21dcc07...codecov:4c95614?diff=split'
      'test/github/test_commit.html': 'https://github.com/codecov/codecov-python/commit/91acfd99a5103ab16ff183a117a76c0d492c68a7'
      # Bitbucket
      'test/bitbucket/test_src.html': 'https://bitbucket.org/osallou/go-docker/src/8c304f3171716b23f78dc6c1f6541b290a43386b/godocker/godscheduler.py'
      'test/bitbucket/test_commits.html': 'https://bitbucket.org/osallou/go-docker/commits/33a5c94583baf1fcc98db2c295c97283255163c1'
      'test/bitbucket/test_tree.html': 'https://bitbucket.org/osallou/go-docker/src/8c304f3171716b23f78dc6c1f6541b290a43386b/godocker/?at=master'
      # Gitlab

    dom_munger:
      all:  # excuted first
        src: 'test/**/*.html'
        options:
          remove: ['link', 'script']
          prepend: {selector:'body', html:'<div id="mocha"></div>'},
          append:[
            {selector:'head', html:'''<link rel="stylesheet" href="../mocha.css" />
                                      <script src="../mocha.js"></script>
                                      <script src="../chai.js"></script>
                                      <script src="../sinon-1.17.6.js"></script>
                                      <script src="../bridge.js"></script>
                                      <script src="../../lib/jquery-2.1.3.min.js"></script>
                                      <script src="../deps.js"></script>
                                      <script src="../../lib-cov/codecov.js"></script>
                                      <script src="../../lib-cov/github.js"></script>
                                      <script src="../../lib-cov/bitbucket.js"></script>
                                      <script src="../../lib-cov/bitbucket_server.js"></script>\n'''}
          ]
      github_blob: {src: 'test/github/test_blob.html', options: {append: {selector:'body',html:'<script src="test_blob.js"></script>'}}}
      github_pull: {src: 'test/github/test_pull.html', options: {append: {selector:'body',html:'<script src="test_pull.js"></script>'}}}
      github_tree: {src: 'test/github/test_tree.html', options: {append: {selector:'body',html:'<script src="test_tree.js"></script>'}}}
      github_blame: {src: 'test/github/test_blame.html', options: {append: {selector:'body',html:'<script src="test_blame.js"></script>'}}}
      github_compare: {src: 'test/github/test_compare.html', options: {append: {selector:'body',html:'<script src="test_compare.js"></script>'}}}
      github_compare_split: {src: 'test/github/test_compare_split.html', options: {append: {selector:'body',html:'<script src="test_compare_split.js"></script>'}}}
      github_commit: {src: 'test/github/test_commit.html', options: {append: {selector:'body',html:'<script src="test_commit.js"></script>'}}}

      bitbucket_src: {src: 'test/bitbucket/test_src.html', options: {append: {selector:'body',html:'<script src="test_src.js"></script>'}}}
      bitbucket_tree: {src: 'test/bitbucket/test_tree.html', options: {append: {selector:'body',html:'<script src="test_tree.js"></script>'}}}

      bitbucket_server_src:
        src: 'test/bitbucket_server/test_src.html'
        options: 
          append:[
            { selector:'head', html:'<script src="../data/github/gulp_starter.js"></script>\n' }
            { selector:'head', html:'<script src="test_src.js"></script>\n' }
          ]
      bitbucket_server_commit:
        src: 'test/bitbucket_server/test_commits.html'
        options: 
          append:[
            { selector:'head', html:'<script src="test_commits.js"></script>' }
          ]

    mocha:
      all:
        options:
          page:
            settings:
              webSecurityEnabled: no
          mocha:
            ignoreLeaks: yes
            globals: ['jQuery*', 'codecov']
          urls: [
            # Github
            #'http://localhost:3000/test/github/test_blob.html'
            #'http://localhost:3000/test/github/test_pull.html'
            #'http://localhost:3000/test/github/test_tree.html'
            #'http://localhost:3000/test/github/test_blame.html'
            #'http://localhost:3000/test/github/test_compare.html'
            #'http://localhost:3000/test/github/test_commit.html'
            # Bitbucket
            #'http://localhost:3000/test/bitbucket/test_src.html'
            #'http://localhost:3000/test/bitbucket/test_tree.html'
            # Bitbucket server
            #'http://localhost:3000/test/bitbucket_server/test_commits.html'
            'http://localhost:3000/test/bitbucket_server/test_src.html'
            # Gitlab
            ]
          run: yes
          reporter: 'mocha-phantom-coverage-reporter'
          timeout: 10000

  # -------------
  # Load Packages
  # -------------
  grunt.loadNpmTasks 'grunt-curl'
  grunt.loadNpmTasks 'grunt-shell'
  grunt.loadNpmTasks 'grunt-mocha'
  grunt.loadNpmTasks 'grunt-coffeecov'
  grunt.loadNpmTasks 'grunt-dom-munger'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  grunt.registerTask 'default',  ['coffee', 'less']
  grunt.registerTask 'build',    ['default', 'clean', 'copy', 'concat', 'shell']
  grunt.registerTask 'test',     ['curl', 'dom_munger', 'runTests']
  grunt.registerTask 'runTests', ['coffeecov', 'connect', 'mocha']
