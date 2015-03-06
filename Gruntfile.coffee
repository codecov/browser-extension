module.exports = (grunt) ->
  grunt.initConfig
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

  grunt.loadNpmTasks 'grunt-mocha'
  grunt.loadNpmTasks 'grunt-contrib-less'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.registerTask 'default', ['coffee', 'less']
  grunt.registerTask 'test', ['mocha']
