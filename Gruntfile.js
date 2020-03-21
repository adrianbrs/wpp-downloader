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
                        ext: ".min.js"
                    }
                ]
            }
        },
        sass: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "src/scss",
                        src: ["*.scss"],
                        dest: "app/css",
                        ext: ".css"
                    }
                ]
            }
        },
        watch: {
            scripts: {
                files: "src/js/**/*.js",
                tasks: ["uglify"],
                options: {
                    interrupt: true
                }
            },
            styles: {
                files: "src/scss/**/*.scss",
                tasks: ["sass"]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-contrib-uglify-es");
    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Default task(s).
    grunt.registerTask("default", ["uglify", "sass"]);
    grunt.registerTask("dev", ["watch"]);
};
