// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  cloudFunctions: 'https://us-central1-comparrot-8cd1d.cloudfunctions.net',
  projectName: 'comparrot',
  firebase: {
    apiKey: "AIzaSyAti1-8hQW-DDVw5V8_CMPAxdmpMuFp9MU",
    authDomain: "comparrot-8cd1d.firebaseapp.com",
    projectId: "comparrot-8cd1d",
    storageBucket: "comparrot-8cd1d.appspot.com",
    messagingSenderId: "218679252583",
    appId: "1:218679252583:web:32cfe24c7311cb62d866c2",
    measurementId: "G-WBW95YTENJ"
  },
};
