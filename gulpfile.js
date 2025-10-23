import gulp from 'gulp'; // gulp
import browserSync from 'browser-sync';
import notify from 'gulp-notify'; // выводит сообщения об ошибках
import plumber from 'gulp-plumber'; // обрабатывает ошибки
import { deleteAsync } from 'del'; // позволяет удалять файлы и папки
import autoprefixer from 'gulp-autoprefixer'; // добавляет префиксы
import fileinclude from 'gulp-file-include'; // для подключения файлов html друг в друга
import gulpHtmlmin from 'gulp-htmlmin'; // минимизирует файлы
import sourcemaps from 'gulp-sourcemaps'; // добавляет sourcemaps карту
import gulpIf from 'gulp-if'; // запускает команды по условию

import * as sass from 'sass'; // работает с sass файлами
import gulpSass from 'gulp-sass'; // принимает sass или scss файлы и передаёт в sass для последующей обработки.
import sassGlob from 'gulp-sass-glob'; // автоматическое подключение sсss файлов
import gcmq from 'gulp-group-css-media-queries'; // груперует медиа запросы
import concat from 'gulp-concat'; // объяденяет файлы
import htmlmin from 'gulp-htmlmin';
import cleanCSS from 'gulp-clean-css';

// JS
import webpack from 'webpack-stream';

let dev = false;

const path = {
  src: {
    base: 'src/',
    html: 'src/html/*.html',
    scss: 'src/scss/main.scss',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*.{jpg,svg,jpeg,png,gif,webp,ico}',
    assets: ['src/fonts/**/*.*', 'src/libs/**/*.*', 'src/video/**/*.*'],
    libs: 'src/libs/**/*.*',
    fonts: 'src/fonts/**/*.*',
    video: 'src/video/**/*.*',
    doc: 'src/doc/**/*.*',
    mail: 'src/*.php',
  },
  dist: {
    base: 'dist/',
    libs: 'dist/libs/',
    html: 'dist/',
    css: 'dist/css/',
    js: 'dist/js/',
    img: 'dist/images/',
    fonts: 'dist/fonts/',
    video: 'dist/video/',
    doc: 'dist/doc/',
  },
  watch: {
    html: 'src/html/**/*.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    img: 'src/images/**/*.{jpg,svg,jpeg,png,gif,webp,ico}',
  },
};

export const html = () => {
  return gulp
    .src(path.src.html)
    .pipe(
      plumber({ // обрабатываем ошибки
        errorHandler: notify.onError(function (err) {
          return {
            title: "HTML include",
            sound: false,
            message: err.message
          };
        })
      })
    )
    .pipe(fileinclude({ prefix: '@@' }))
    .pipe(gulpIf(!dev, htmlmin({ // проверяем с помощью gulpIf если первый аргумент будет true то вызываем таск во втором аргументе. 
      removeComments: true, // убираем комментарии
      collapseWhitespace: true, // убираем пробелы
    })))
    .pipe(gulp.dest(path.dist.html)) // копируем обработанные файлы в папку сборки
    .pipe(browserSync.stream())
};

const scssToCss = gulpSass(sass);

export const scss = () => {
  return gulp
    .src(path.src.scss)
    .pipe(sassGlob({ // подключаем scss файлы по маске
      ignorePaths: [
        '**/**/_old_*.scss', // не отслеживаем файлы которые попадают под маску
      ]
    })
    )
    .pipe(
      plumber({
        errorHandler: notify.onError(function (err) {
          return {
            title: "SCSS include",
            sound: false,
            message: err.message
          };
        })
      })
    )
    .pipe(gulpIf(dev, sourcemaps.init())) // инициализируем карту scss
    .pipe(scssToCss({ quietDeps: true })) // обрабатываем scss. Директива { quietDeps: true } отключает уведомления о запрете @import в scss файлах
    .pipe(gulpIf(!dev, autoprefixer({ // обрабатываем автопрефиксером
      overrideBrowserslist: ["last 1 versions"]
    })))
    .pipe(gulpIf(!dev, gcmq()))// объединяем медиа запросы
    .pipe(gulpIf(dev, sourcemaps.write(".")))
    .pipe(gulpIf(!dev, cleanCSS({
      2: {
        specialComments: 0,
      },
    })))
    .pipe(gulp.dest(path.dist.css))
    .pipe(browserSync.stream())
};

const configWebpack = {
  mode: dev ? 'development' : 'production',
  devtool: dev ? 'eval-sourse-map' : false,
  optimization: {
    minimize: false,
  },
  output: {
    filename: 'script.js'
  },
  module: {
    rules: []
  }
};

if (!dev) {
  configWebpack.module.rules.push({
    test: /\.(js)$/,
    exclude: /(node_modules)/,
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime']
    }
  })
}

export const js = () => {
  return gulp
    .src(path.src.js)
    .pipe(plumber())
    .pipe(webpack(configWebpack))
    // .pipe(concat('all.js'))
    .pipe(gulp.dest(path.dist.js))
    .pipe(browserSync.stream())
};

export const images = () => {
  return gulp
    .src(path.src.img, { encoding: false })
    .pipe(gulp.dest(path.dist.img))
    .pipe(browserSync.stream({ once: true, }))
};

export const libs = () => {
  return gulp
    .src(path.src.libs, { encoding: false })
    .pipe(gulp.dest(path.dist.libs))
    .pipe(browserSync.stream({
      once: true,
    }))
};

export const fonts = () => {
  return gulp
    .src(path.src.fonts, { encoding: false })
    .pipe(gulp.dest(path.dist.fonts))
    .pipe(browserSync.stream({
      once: true,
    }))
};

// export const video = () => {
//   return gulp
//     .src(path.src.video,  { encoding: false })
//     .pipe(gulp.dest(path.dist.video))
//     .pipe(browserSync.stream({
//       once: true,
//     }))
// };

export const doc = () => {
  return gulp
    .src(path.src.doc, { encoding: false })
    .pipe(gulp.dest(path.dist.doc))
    .pipe(browserSync.stream({
      once: true,
    }))
};

// export const mail = () => {
//   return gulp
//     .src(path.src.mail)
//     .pipe(gulp.dest(path.dist.base))
//     .pipe(browserSync.stream({
//       once: true,
//     }))
// };

export const server = () => {
  browserSync.init({
    // host: 'localhost', // переопределяет хост
    // notify: false, // показывает всплывающие увидомления в браузере
    // tunnel: true, // публикует сайт на времменном сервере в интернете 
    server: {
      baseDir: path.dist.base
    }
  });
  gulp.watch(path.watch.html, html) // следим за файлами html и при изменении запускаем таск html
  gulp.watch(path.watch.scss, scss) // следим за файлами scss и при изменении запускаем таск scss
  gulp.watch(path.watch.js, js) // следим за файлами js и при изменении запускаем таск js
  gulp.watch(path.watch.img, images) // следим за файлами images и при изменении запускаем таск images
  gulp.watch(path.src.libs, libs) // следим за файлами images и при изменении запускаем таск images
  gulp.watch(path.src.fonts, fonts) // следим за файлами images и при изменении запускаем таск images
  // gulp.watch(path.src.doc, doc) // следим за файлами images и при изменении запускаем таск images
  // gulp.watch(path.src.mail, mail) // следим за файлами images и при изменении запускаем таск images
  // gulp.watch(path.src.video, video) // следим за файлами images и при изменении запускаем таск images
};

const clear = async () => await deleteAsync(path.dist.base, { force: true }); // очищаем папку dist

const develop = (ready) => { // функция вызывающая сборку для разработки
  dev = true;
  ready();
}

// export const base = gulp.parallel(html, scss, js, images, libs, video, doc, mail, fonts) // запускаем паралельные таски
export const base = gulp.parallel(html, scss, js, images, libs, fonts) // запускаем паралельные таски

export const build = gulp.series(clear, base); // Собирает сборку на продакшн

export default gulp.series(develop, clear, base, server);