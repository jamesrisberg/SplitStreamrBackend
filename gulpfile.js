var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

var tsProject = ts.createProject({
    module: "commonjs",
    target: "es5",
    preserveConstEnums: true,
    sourceMap: true
});

gulp.task('typescript', function() {
    var result = gulp.src('src/**/*.ts')
            .pipe(sourcemaps.init())
            .pipe(ts(tsProject));

    return result.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/'));
});

// Start up the application
gulp.task('start' ,['build'], function() {
    nodemon({
        script: 'app/app.js',
        watch: [
            'app/**'
        ]
    });
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.ts', ['typescript']);
});

gulp.task('build', ['typescript']);
gulp.task('default', ['build', 'start', 'watch']);
