module.exports = grunt => {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        paths: {
            js: [
                {
                    expand: true,
                    src: ["**/*.js"],
                    dest: "extension/assets/js",
                    cwd: "src/js",
                    rename: function(dst, src) {
                        const srcParts = String(src).split("/");
                        let dstName = srcParts[0].split(".")[0];
                        if (srcParts.length > 1)
                            dstName = srcParts
                                .slice(0, srcParts.length - 1)
                                .join("/");
                        return `${dst}/${dstName}.js`;
                    }
                }
            ],
            sass: [
                {
                    expand: true,
                    src: ["**/*.scss", "!**/_*.scss"],
                    cwd: "src/scss",
                    dest: "extension/assets/css",
                    ext: ".css"
                }
            ]
        },
        uglify: {
            dev: {
                options: {
                    beautify: true,
                    mangle: false,
                    compress: false,
                    banner:
                        '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: "<%= paths.js %>"
            },
            prod: {
                options: {
                    banner:
                        '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                files: "<%= paths.js %>"
            }
        },
        sass: {
            dev: {
                options: {
                    style: "expanded",
                    update: true
                },
                files: "<%= paths.sass %>"
            },
            prod: {
                options: {
                    style: "compressed"
                },
                files: "<%= paths.sass %>"
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
