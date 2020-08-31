// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

import karma from '@angular-devkit/build-angular/plugins/karma';
import karmaChromeLauncher from 'karma-chrome-launcher';
import karmaCoverageIstanbulReporter from 'karma-coverage-istanbul-reporter';
import karmaJasmine from 'karma-jasmine';
import karmaJasmineHTMLReporter from 'karma-jasmine-html-reporter';
import path from 'path';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      karmaJasmine,
      karmaChromeLauncher,
      karmaJasmineHTMLReporter,
      karmaCoverageIstanbulReporter,
      karma,
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    files: [],
    preprocessors: {},
    mime: {
      'text/x-typescript': ['ts', 'tsx'],
    },
    coverageIstanbulReporter: {
      dir: path.join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true,
    },
    angularCli: {
      config: './.angular-cli.json',
      environment: 'dev',
    },
    reporters:
      config.angularCli && config.angularCli.codeCoverage
        ? ['progress', 'coverage-istanbul']
        : ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
  });
};
