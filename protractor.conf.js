// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

/*global jasmine */
import SpecReporter from 'jasmine-spec-reporter';
import tsNode from 'ts-node';

exports.config = {
  allScriptsTimeout: 11000,
  capabilities: {
    browserName: 'chrome',
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: () => undefined,
  },
  useAllAngular2AppRoots: true,
  beforeLaunch: function () {
  },
  onPrepare: function () {
    jasmine.getEnv().addReporter(new SpecReporter());
  },
};
