module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    uglify: {
      build: {
        options: {
          banner:
            '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: [
          {
            expand: true,
            src: "**/*.js",
            dest: "app/js",
            cwd: "src/js",
            rename: function(dst, src) {
                return `${dst}/${src.replace(".js", ".min.js")}`
            }
          }
        ]
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-contrib-uglify-es");

  // Default task(s).
  grunt.registerTask("default", ["uglify"]);
};
