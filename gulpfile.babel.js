//imports
import gulp from 'gulp';
import path from 'path';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';
import autoprefixer from 'gulp-autoprefixer';
import del from "del";
import browserSync from 'browser-sync';
import uglify from 'gulp-uglify';
import htmlmin from 'gulp-htmlmin';
import sharpResponsive from "gulp-sharp-responsive";
import size from 'gulp-size';
import ttf2woff2 from 'gulp-ttf2woff2';
import fileinclude from'gulp-file-include';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import svgSprite from 'gulp-svg-sprite';



// variables
const sass = gulpSass(dartSass);
const configFTP = {
    host: '', // Адрес FTP сервера
    user: '', // Имя пользователя
    password: '', // Пароль
    parallel: 20, // Кол-во одновременных потоков
};
//const projectDirName = path.basename(path.resolve());
const buildPath = `./_build`;
const srcPath = `./_src`;
const paths = {
    allFiles: {
        src: `${srcPath}/**/*.*`,
        dest: `${buildPath}/`,
    },
    ftp: ``,
    //ToDo: path to variables, add media folder instead IMAGES SVG etc.
    static: {
        src:`${srcPath}/static/**/*.*`,
        dest: `${buildPath}/static/`
    },
    styles: {
        src: '_src/SCSS/**/*.{scss, css, sass}',
        dest: '_build/CSS/'
    },
    scripts: {
        src: '_src/SCRIPTS/**/*.js',
        dest: '_build/SCRIPTS/'
    },
    documentsParts: "_src/HTML_parts/**/*.html",
    documents: {
        src: ['_src/*.html'],
        dest: '_build/',
    },
    imgs: {
        src: {
            jpg: ['_src/IMAGES/**/*.jpg', '_src/IMAGES/**/*.jpeg'],
            png: '_src/IMAGES/**/*.png',
        },
        dest: '_build/IMAGES/',
    },
    fonts: {
        src: '_src/SCSS/FONTS/**/*.ttf',
        dest: '_build/SCSS/FONTS/'
    },
    svg:{
        src: '_src/IMAGES/SVG/**/*.svg',
        dest: '_build/IMAGES/SVG/'
    },
    jason:{
        src:'_src/SCRIPTS/DB/**/*.json',
        dest:'_build/SCRIPTS/DB/'
    }
};

const handleError = (taskName) => {
    return plumber({
        errorHandler: notify.onError({
            title: taskName,
            message: 'Error: <%= error.message %>',
        }),
    });
};
//ToDo: turn all func to arrow ()=>{}

//tasks
function serverFunc() {
    browserSync.init({
        server: {
            baseDir: paths.allFiles.dest,
            index: "index.html",
        },
        ui: {
            port: 8080,
        },
    });
}

const createSvgSprite = () => {
    return gulp.src(paths.svg.src)
        .pipe(plugins.handleError('SVG'))
        .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: `icons.svg`,
                        example: true,
                    },
                },
            })
        )
        .pipe(gulp.dest(paths.svg.dest));
};

function copyFunc() {
    return gulp.src(paths.static.src)
    .pipe(gulp.dest(paths.static.dest))
}


function JsonFunc() {
    return gulp.src(paths.jason.src)
        .pipe(gulp.dest(paths.jason.dest))}

function svgFunc() {
    return gulp.src(paths.svg.src)
        .pipe(gulp.dest(paths.svg.dest))}

function deleteFunc() {
    return del([paths.allFiles.dest])
}

function fontFunc() {
    return gulp.src(paths.fonts.src)
        .pipe(ttf2woff2())
        .pipe(size())
        .pipe(gulp.dest(paths.fonts.dest))
        .pipe(browserSync.stream());
}

function ScriptFunc() {
    return gulp.src(paths.scripts.src)
        .pipe(sourcemaps.init({largeFile: true}))
        .pipe(babel())
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(size())
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(browserSync.stream());
}

function StyleFunc() {
    return gulp.src(paths.styles.src)
        .pipe(sourcemaps.init({largeFile: true}))
        .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: true
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(size())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.stream());
}

function jpgFunc() {
    return gulp.src(paths.imgs.src.jpg)
        .pipe(sharpResponsive({
            includeOriginalFile: true,
            formats: [
                { format: "webp", quality: 75},
                { format: "avif"},
            ]
        }))
        .pipe(size())
        .pipe(gulp.dest(paths.imgs.dest))
        .pipe(browserSync.stream());
}

function pngFunc() {
    return gulp.src(paths.imgs.src.png)
        .pipe(sharpResponsive({
            includeOriginalFile: true,
            formats: [
                { format: "webp", quality: 80},
            ]
        }))
        .pipe(size())
        .pipe(gulp.dest(paths.imgs.dest))
        .pipe(browserSync.stream());
}



function HTMLFunc() {
    return gulp.src(paths.documents.src)
        .pipe(fileinclude({
            prefix: '@@',
            /**basepath: '@file'**/
        }))
        .pipe(htmlmin())
        .pipe(size())
        .pipe(gulp.dest(paths.documents.dest))
        .pipe(browserSync.stream());
}

function watchFunc() {
    gulp.watch(paths.scripts.src, ScriptFunc);
    gulp.watch(paths.styles.src, StyleFunc);
    gulp.watch(paths.imgs.src.jpg, jpgFunc);
    gulp.watch(paths.imgs.src.png, pngFunc);
    gulp.watch(paths.documents.src, HTMLFunc);
    gulp.watch(paths.svg.src, svgFunc);
    gulp.watch(paths.jason.src, JsonFunc);
    gulp.watch(paths.documentsParts, HTMLFunc);
}




const defaultTask = gulp.series(deleteFunc,  gulp.parallel(svgFunc, JsonFunc,  HTMLFunc ,fontFunc, ScriptFunc, StyleFunc, gulp.parallel(jpgFunc, pngFunc,), ), gulp.parallel(serverFunc, watchFunc,),);

gulp.task('delete', deleteFunc)
gulp.task('img', jpgFunc)
gulp.task('default', defaultTask)