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
        src: 'src/'
        dest: '.tmp/js/app'

    coffee:
      default:
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

    mocha:
      all:
        options:
          mocha:
            ignoreLeaks: no

          urls: ['http://localhost:3000/test/github/test_blob.html']
          run: yes
          reporter: 'mocha-phantom-coverage-reporter'
          timeout: 10000

  grunt.loadNpmTasks 'grunt-mocha'
  grunt.loadNpmTasks 'grunt-coffeecov'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-connect'

  grunt.registerTask 'default', ['coffee', 'less']
  grunt.registerTask 'test', ['coffeecov', 'connect', 'mocha']
