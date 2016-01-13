var concat = require('gulp-concat');
var es = require('event-stream');
var gutil = require('gulp-util');
var path = require('path');
var header = require('gulp-header');
var footer = require('gulp-footer');


var TRANSLATIONS_HEADER = 'angular.module("<%= module %>"<%= standalone %>).config(["$translateProvider", function($translateProvider) {\n';
var TRANSLATIONS_BODY = '$translateProvider.translations("<%= language %>", <%= contents %>);\n';
var TRANSLATIONS_FOOTER = '}]);\n';

var DEFAULT_FILENAME = 'translations.js';
var DEFAULT_MODULE = 'translations';
var MODULE_TEMPLATES = {
  requirejs: {
    header: 'define([\'angular\'], function(angular) {\n\'use strict\';\nreturn ',
    footer: '});'
  },
  browserify: {
    header: '\'use strict\';\nmodule.exports = '
  },
  es6: {
    header: 'import angular from \'angular\';\nexport default '
  },
  iife: {
    header: '(function(){\n',
    footer: '})();'
  }
};

function cacheTranslations(options) {
  return es.map(function(file, callback) {
    file.contents = new Buffer(gutil.template(TRANSLATIONS_BODY, {
      contents: file.contents,
      file: file,
      language: options.language || file.path.split(path.sep).pop().match(/^(?:[\w]{3,}-)?([a-z]{2}[_|-]?(?:[A-Z]{2})?)\.json$/i).pop()
    }));
    callback(null, file);
  });
}

function wrapInModule(moduleSystem) {
  var moduleTemplate = MODULE_TEMPLATES[moduleSystem];

  if (!moduleTemplate) {
    return gutil.noop();
  }

  return es.pipeline(
      header(moduleTemplate.header || ''),
      footer(moduleTemplate.footer || '')
  );

}

function gulpAngularTranslate(filename, options) {
  if (typeof filename === 'string') {
    options = options || {};
  } else {
    options = filename || {};
    filename = options.filename || DEFAULT_FILENAME;
  }

  if (options.moduleSystem) {
    options.moduleSystem = options.moduleSystem.toLowerCase();
  }

  var translationsHeader = options.translationsHeader || TRANSLATIONS_HEADER;
  var translationsFooter = options.translationsFooter || TRANSLATIONS_FOOTER;

  return es.pipeline(
    cacheTranslations(options),
    concat(filename),
    header(translationsHeader, {
      module: options.module || DEFAULT_MODULE,
      standalone: options.standalone === false ? '' : ', []'
    }),
    footer(translationsFooter, {
      module: options.module || DEFAULT_MODULE
    }),
    wrapInModule(options.moduleSystem)
  )
}

module.exports = gulpAngularTranslate;
