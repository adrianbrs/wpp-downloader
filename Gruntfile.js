module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            dev: {
                options: {
                    beautify: true,
                    mangle: false,
                    compress: false,
                    banner:
                        '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: [
                    {
                        expand: true,
                        src: "**/*.js",
                        dest: "extension/assets/js",
                        cwd: "src/js",
                        ext: ".js"
                    }
                ]
            },
            prod: {
                options: {
                    banner:
                        '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: [
                    {
                        expand: true,
                        src: "**/*.js",
                        dest: "extension/assets/js",
                        cwd: "src/js",
                        ext: ".js"
                    }
                ]
            }
        },
        sass: {
            dev: {
                options: {
                    style: "expanded",
                    update: true
                },
                files: [
                    {
                        expand: true,
                        cwd: "src/scss",
                        src: ["*.scss"],
                        dest: "extension/assets/css",
                        ext: ".css"
                    }
                ]
            },
            prod: {
                options: {
                    style: "compressed"
                },
                files: [
                    {
                        expand: true,
                        cwd: "src/scss",
                        src: ["*.scss"],
                        dest: "extension/assets/css",
                        ext: ".css"
                    }
                ]
            }
        },
        watch: {
            scripts: {
                files: "src/js/**/*.js",
                tasks: ["uglify:dev"],
                options: {
                    interrupt: true
                }
            },
            styles: {
                files: "src/scss/**/*.scss",
                tasks: ["sass:dev"]
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks("grunt-contrib-uglify-es");
    grunt.loadNpmTasks("grunt-contrib-sass");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Default task(s).
    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["uglify:prod", "sass:prod"]);
};
