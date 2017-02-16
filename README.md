# Ryan's Angular 1x seed w/bootstrap sass
---
Quickstart for setting up an Angular 1x application with Bootstrap Sass 3.3.7.
Also included is a lightweight express server for serving static assets. Can be easily modified to run a site on Heroku, Openshift, or any other cloud platform of your choosing.

This seed was developed with best practices in mind and follows the angular 1x style guide by John Papa: <https://github.com/johnpapa/angular-styleguide/tree/master/a1>

## Installation
---
Node version 4+ recommended.

1. Install bower globally if you haven't already `npm install -g bower`
2. Install gulp globally if you haven't already `npm install -g gulp`
2. Clone this repo to your machine
3. Browse to the root directory of your locally cloned repo and run `npm install && bower install`

## Commands
---
- Development mode w/browsersync live reload: `npm run dev`
- Build (with sourcemaps): `npm run build`
- Production Build (without sourcemaps) & static file hashing: `npm run build:prod`
- Build and Serve: `npm run serve`
- Build (Production version) and Serve: `npm run serve:prod`
- Serve existing build (from dist/): `npm start`
- Run karma tests: `npm run test`

## Build Information
---
There are different build behaviors between dev, build and production build.

### Development Mode
`npm run dev`
- Injects `src/` app & framework-specific js files individually into the index.html file for quick refresh and easier debugging during development
- Concat and compile Sass (scss) files to .tmp folder
- Host images and fonts from .tmp folder

### Build
`npm run build`
- Builds everything to `dist/` folder.
- Concatenate, minify, uglify all app source javascript files into app.js file. Generate sourcemaps for debugging.
- Concatenate, minify, uglify all framework-specific files into main.js file. Generate sourcemaps for debugging.
- Load all html templates into app.js file via angular template cache during build process. Instead of templates getting called via an ajax request, they are immediately available from the js source. Considered best practice for running in prod.

### Production Build
`npm run build:prod`
- Builds everything to `dist/` folder.
- Sourcemaps are not included in production build (considered best practice).
- Concatenate, minify, uglify all app source javascript files into app.js file. 
- Concatenate, minify, uglify all framework-specific files into main.js file. Generate sourcemaps for debugging.
- Load all html templates into app.js file via angular template cache during build process. Instead of templates getting called via an ajax request, they are immediately available from the js source. Considered best practice for running in prod.
- Static javascript and stylesheet files are built with hashed filenames. Considered best practice and helps with browser caching. 






