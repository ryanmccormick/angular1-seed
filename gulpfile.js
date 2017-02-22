// ## Globals
var argv          = require('minimist')(process.argv.slice(2));
var autoprefixer  = require('gulp-autoprefixer');
var browserSync   = require('browser-sync').create();
var changed       = require('gulp-changed');
var concat        = require('gulp-concat');
var flatten       = require('gulp-flatten');
var gulp          = require('gulp');
var gulpif        = require('gulp-if');
var imagemin      = require('gulp-imagemin');
var jshint        = require('gulp-jshint');
var lazypipe      = require('lazypipe');
var less          = require('gulp-less');
var merge         = require('merge-stream');
var cssNano       = require('gulp-cssnano');
var plumber       = require('gulp-plumber');
var rev           = require('gulp-rev');
var runSequence   = require('run-sequence');
var sass          = require('gulp-sass');
var sourcemaps    = require('gulp-sourcemaps');
var uglify        = require('gulp-uglify');
var ngAnnotate    = require('gulp-ng-annotate');
var estream       = require('event-stream');
var templateCache = require('gulp-angular-templatecache');
var inject        = require('gulp-inject');
var fs            = require('fs');
var gulpCopy      = require('gulp-copy');
var proxyMiddleware = require('http-proxy-middleware');


// See https://github.com/austinpray/asset-builder
var manifest = require('asset-builder')('./src/assets/manifest.json');

// `path` - Paths to base asset directories. With trailing slashes.
// - `path.source` - Path to the source files. Default: `assets/`
// - `path.dist` - Path to the build directory. Default: `dist/`
var path = manifest.paths;

// `config` - Store arbitrary configuration values here.
var config = manifest.config || {};

// `globs` - These ultimately end up in their respective `gulp.src`.
// - `globs.js` - Array of asset-builder JS dependency objects. Example:
//   ```
//   {type: 'js', name: 'main.js', globs: []}
//   ```
// - `globs.css` - Array of asset-builder CSS dependency objects. Example:
//   ```
//   {type: 'css', name: 'main.css', globs: []}
//   ```
// - `globs.fonts` - Array of font path globs.
// - `globs.images` - Array of image path globs.
// - `globs.bower` - Array of all the main Bower files.
var globs = manifest.globs;

// `project` - paths to first-party assets.
// - `project.js` - Array of first-party JS assets.
// - `project.css` - Array of first-party CSS assets.
var project = manifest.getProjectGlobs();

// CLI options
var enabled = {
  // Enable static asset revisioning when `--production`
  rev: argv.production,
  // Disable source maps when `--production`
  maps: !argv.production,
  // Fail styles task on error when `--production`
  failStyleTask: argv.production,
  // Fail due to JSHint warnings only when `--production`
  failJSHint: argv.production,
  // Strip debug statments from javascript when `--production`
  stripJSDebug: argv.production
};

// Path to the compiled assets manifest in the dist directory
var revManifest = path.dist + 'assets.json';

// ## Reusable Pipelines
// See https://github.com/OverZealous/lazypipe

// ### CSS processing pipeline
// Example
// ```
// gulp.src(cssFiles)
//   .pipe(cssTasks('main.css')
//   .pipe(gulp.dest(path.dist + 'styles'))
// ```
var cssTasks = function(filename) {
  return lazypipe()
    .pipe(function() {
      return gulpif(!enabled.failStyleTask, plumber());
    })
    .pipe(function() {
      return gulpif(enabled.maps, sourcemaps.init());
    })
    .pipe(function() {
      return gulpif('*.less', less());
    })
    .pipe(function() {
      return gulpif('*.scss', sass({
        outputStyle: 'nested', // libsass doesn't support expanded yet
        precision: 10,
        includePaths: ['.'],
        errLogToConsole: !enabled.failStyleTask
      }));
    })
    .pipe(concat, filename)
    .pipe(autoprefixer, {
      browsers: [
        'last 2 versions',
        'android 4',
        'opera 12'
      ]
    })
    .pipe(cssNano, {
      safe: true
    })
    .pipe(function() {
      return gulpif(enabled.rev, rev());
    })
    .pipe(function() {
      return gulpif(enabled.maps, sourcemaps.write('.', {
        sourceRoot: 'assets/styles/'
      }));
    })();
};

// ### JS processing pipeline
// Example
// ```
// gulp.src(jsFiles)
//   .pipe(jsTasks('main.js')
//   .pipe(gulp.dest(path.dist + 'scripts'))
// ```
var jsTasks = function(filename) {
  return lazypipe()
    .pipe(function() {
      return gulpif(enabled.maps, sourcemaps.init());
    })
    .pipe(concat, filename)
    .pipe(ngAnnotate)
    .pipe(uglify, {
      compress: {
        'drop_debugger': enabled.stripJSDebug
      }
    })
    .pipe(function() {
      return gulpif(enabled.rev, rev());
    })
    .pipe(function() {
      return gulpif(enabled.maps, sourcemaps.write('.', {
        sourceRoot: 'src/assets/scripts/'
      }));
    })();
};


// ### Write to rev manifest
// If there are any revved files then write them to the rev manifest.
// See https://github.com/sindresorhus/gulp-rev
var writeToManifest = function(directory) {
  return lazypipe()
    .pipe(gulp.dest, path.dist + directory)
    .pipe(browserSync.stream, {match: '**/*.{js,css}'})
    .pipe(rev.manifest, revManifest, {
      base: path.dist,
      merge: true
    })
    .pipe(gulp.dest, path.dist)();
};

function templateStream() {
  // Update template to use closure
  // Add support for safe minification
  /*
  var tHeader = "(function() { 'use strict'\; angular.module(\"<%= module %>\").run(templateCache)\; " +
                "templateCache.$inject = [\"$templateCache\"]\; function templateCache($templateCache) { ",
        tBody = "$templateCache.put(\"<%= url %>\", \"<%= contents %>\")\; ";
        tFooter = "}})()\; ";
  */

  var tHeader = '(function() { \'use strict\'\; angular.module(\'<%= module %>\').run(templateCache)\; ' +
          'templateCache.$inject = [\'$templateCache\']\; function templateCache($templateCache) { ',
  tBody = '$templateCache.put(\'<%= url %>\', \'<%= contents %>\')\; ',
  tFooter = '}})()\; ';

    return gulp.src(path.source + '/app/**/*.tpl.html')
      .pipe(templateCache({
        root: 'app',
        module: 'app',
        templateHeader: tHeader,
        templateBody: tBody,
        templateFooter: tFooter
    }));
}

gulp.task('tempCache', function() {
  return templateStream()
    //.pipe(gulp.dest(path.source + '/app/'));
    .pipe(gulp.dest(path.tmp));
});


// ## Gulp tasks
// Run `gulp -T` for a task summary

// ### Styles
// `gulp styles` - Compiles, combines, and optimizes Bower CSS and project CSS.
// By default this task will only log a warning if a precompiler error is
// raised. If the `--production` flag is set: this task will fail outright.
gulp.task('styles', ['wiredep'], function() {
  var merged = merge();
  manifest.forEachDependency('css', function(dep) {
    var cssTasksInstance = cssTasks(dep.name);
    if (!enabled.failStyleTask) {
      cssTasksInstance.on('error', function(err) {
        console.error(err.message);
        this.emit('end');
      });
    }
    merged.add(gulp.src(dep.globs, {base: 'styles'})
      .pipe(cssTasksInstance));
  });
  return merged
    .pipe(writeToManifest('styles'));
});

// ### Scripts
// `gulp scripts` - Runs JSHint then compiles, combines, and optimizes Bower JS
// and project JS.
gulp.task('scripts', ['jshint'], function() {
  var merged = merge();
  manifest.forEachDependency('js', function(dep) {
    //console.log(dep);
    merged.add(
      gulp.src(dep.globs, {base: 'scripts'})
        .pipe(jsTasks(dep.name))
    );
  });
  return merged
    .pipe(writeToManifest('scripts'));
});


var revAssetStream = function() {
  // define manifest files
  var assetManifest = JSON.parse(fs.readFileSync(path.source + 'assets/manifest.json', 'utf8'));
  var manifest = argv.production ? JSON.parse(fs.readFileSync('dist/assets.json', 'utf8')) : undefined;

  // File Source Keys
  var sourceKeys = [];
  var assetPaths = [];
  var asset = [];

  // Build sourceKeys Array
  for(var k in assetManifest.dependencies) {
    if (k !== 'images' && k !== 'fonts') {
      sourceKeys.push(k);
    }
  }

  // Build Asset Injection list Array
  for (var i = 0, x = sourceKeys.length; i < x; i++) {
    asset = argv.production ? manifest[sourceKeys[i]].split('.') : sourceKeys[i].split('.');

    if (asset[(asset.length - 1)] === 'js') {
      assetPaths.push('./dist/scripts/' + asset.join('.'));
    } else if (asset[(asset.length - 1)] === 'css') {
      assetPaths.push('./dist/styles/' + asset.join('.'));
    }
  }

  return assetPaths;
};

gulp.task('inject', function () {
  var target = gulp.src('src/index.html');
  var sources = gulp.src(revAssetStream(), {read: false});

  return target.pipe(inject(sources, {relative: true, ignorePath: '../dist/'}))
    .pipe(gulp.dest('./dist'));
});

// ### Fonts
// `gulp fonts` - Grabs all the fonts and outputs them in a flattened directory
// structure. See: https://github.com/armed/gulp-flatten
gulp.task('fonts', function() {
  return gulp.src(globs.fonts)
    .pipe(flatten())
    .pipe(gulp.dest(path.dist + 'fonts'))
    .pipe(browserSync.stream());
});

// ### Images
// `gulp images` - Run lossless compression on all the images.
gulp.task('images', function() {
  return gulp.src(globs.images)
    .pipe(imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]
    }))
    .pipe(gulp.dest(path.dist + 'images'))
    .pipe(browserSync.stream());
});

// ### JSHint
// `gulp jshint` - Lints configuration JSON and project JS.
gulp.task('jshint', function() {
  return gulp.src([
    '!bower.json', 'gulpfile.js'
  ].concat(project.js))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(gulpif(enabled.failJSHint, jshint.reporter('fail')));
});


// ### Clean
// `gulp clean` - Deletes the build folder entirely.
gulp.task('clean', require('del').bind(null, [path.dist, path.tmp], { force: true}));

// ### Watch
// `gulp watch` - Use BrowserSync to proxy your dev server and synchronize code
// changes across devices. Specify the hostname of your dev server at
// `manifest.config.devUrl`. When a modification is made to an asset, run the
// build step for that asset and inject the changes into the page.
// See: http://www.browsersync.io
gulp.task('watch', function() {
  gulp.watch([path.source + 'src/assets/styles/**/*'], ['styles']);
  gulp.watch([path.source + 'src/assets/scripts/**/*'], ['jshint', 'scripts']);
  gulp.watch('src/app/**/*', ['jshint', 'scripts']);
  gulp.watch([path.source + 'fonts/**/*'], ['fonts']);
  gulp.watch([path.source + 'images/**/*'], ['images']);
  gulp.watch(['bower.json', 'assets/manifest.json'], ['build']);
});

// ### Build
// `gulp build` - Run all the build tasks but don't clean up beforehand.
// Generally you should be running `gulp` instead of `gulp build`.
gulp.task('build', function(callback) {
  runSequence('styles',
              'tempCache',
              'scripts',
              'inject',
              ['fonts', 'images'],
              callback);
});

gulp.task('refresh-build', function(callback) {
  runSequence('tempCache','scripts',callback);
});

// ### Wiredep
// `gulp wiredep` - Automatically inject Less and Sass Bower dependencies. See
// https://github.com/taptapship/wiredep
gulp.task('wiredep', function() {
  var wiredep = require('wiredep').stream;

  return gulp.src(project.css)
    .pipe(wiredep())
    .pipe(changed(path.source + 'assets/styles', {
      hasChanged: changed.compareSha1Digest
    }))
    .pipe(gulp.dest(path.source + 'assets/styles'));
});

// ### Gulp
// `gulp` - Run a complete build. To compile for production run `gulp --production`.
gulp.task('default', ['clean'], function() {
  gulp.start('build');
});

/*******************************
******* DEV Configuration ******
********************************/

/*
  1. Clean .tmp
  2. Compile stylesheets
  3. Get JS files
  4. Add to index.html via wiredep
  5. start browsersync
*/

var jsDevGlobs = function() {
  var globs = [];
  manifest.forEachDependency('js', function(dep) {
    globs.push(dep.globs);
  });

  return globs;
};


gulp.task('seedev', function() {

  console.log(project.js);

});

gulp.task('serve:dev', function(callback) {
  runSequence('dev-clean',
              'dev-index',
              'dev-css',
              ['dev-fonts', 'dev-images'],
              'dev-app-inject',
              'dev-bower-inject',
              'dev-watch',
              callback);
});

gulp.task('dev-clean', require('del').bind(null, [path.tmp], { force: true}));

gulp.task('dev-index', function() {
  return gulp.src('src/index.html')
    .pipe(gulp.dest(path.tmp))
    .pipe(browserSync.stream());
});

gulp.task('dev-css', ['wiredep'], function() {
  var merged = merge();
  manifest.forEachDependency('css', function(dep) {
    var cssTasksInstance = cssTasks(dep.name);
      cssTasksInstance.on('error', function(err) {
        console.error(err.message);
        this.emit('end');
      });
    merged.add(gulp.src(dep.globs, {base: 'styles'})
      .pipe(cssTasksInstance));
  });
  return merged
    .pipe(gulp.dest(path.tmp + 'styles'))
    .pipe(browserSync.stream());
});

gulp.task('dev-bower-inject', function() {
  var wiredep = require('wiredep').stream;
  gulp.src('.tmp/index.html')
    .pipe(wiredep({
      'ignorePath': '../'
    }))
    .pipe(gulp.dest(path.tmp))
    .pipe(browserSync.stream());
});

gulp.task('dev-app-inject', function () {
  var projectSources = project.js;
  
  // Add compiled styles to source
  projectSources.push('.tmp/styles/main.css');

  var target = gulp.src('.tmp/index.html');
  var sources = gulp.src(projectSources, {read: false});

  return target.pipe(inject(sources, { relative: true, ignorePath: ['.tmp', '../src'] }))
    .pipe(gulp.dest(path.tmp))
    .pipe(browserSync.stream());
});

gulp.task('dev-fonts', function() {
  return gulp.src(globs.fonts)
    .pipe(flatten())
    .pipe(gulp.dest(path.tmp + 'fonts'))
    .pipe(browserSync.stream());
});

gulp.task('dev-images', function() {
  return gulp.src(globs.images)
    .pipe(imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeUnknownsAndDefaults: false}, {cleanupIDs: false}]
    }))
    .pipe(gulp.dest(path.tmp + 'images'))
    .pipe(browserSync.stream());
});


gulp.task('dev-watch', function() {
  var routes = {
    '/bower_components': 'bower_components',
    '/app': 'src/app',
    '/assets/scripts': 'src/assets/scripts'
  };
  var baseDir = '.tmp';

  var server = {
    baseDir: baseDir,
    routes: routes
  };

  /*server.middleware = proxyMiddleware('/api/v1/yourapp', {
    target: 'http://url-to-proxy-to.example.com',  
    changeOrigin: true
  });*/
  
  browserSync.init({
    server: server
  });

  /* Watch Tasks */

  // Watch for style changes
  gulp.watch('src/assets/styles/**/*.scss', ['dev-css']);
  gulp.watch('.tmp/styles.main.css').on('change', browserSync.reload);

  // Watch for new images
  gulp.watch('src/assets/images/*.*', ['dev-images']);
  
  // Watch for new app files
  gulp.watch('src/app/**/*.js', ['dev-app-inject']);
  gulp.watch('src/app/**/*.js').on('change', browserSync.reload);
  
  // Watch for bower package updates
  gulp.watch('bower.json', ['dev-bower-inject']);
  gulp.watch('bower.json').on('change', browserSync.reload);

});
