module.exports = (grunt) ->
  grunt.initConfig
    coffee:
      codecov:
        files: 'dist/github.js': 'src/github.coffee'
        options: bare: yes

    watch: 
      codecov:
        files: ['src/*.coffee']
        tasks: 'default'
      wip: files: ["app/**/*.py", "**/*.py", "app/*.py"], tasks: "shell:wip"

  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.registerTask 'default', ['coffee']
