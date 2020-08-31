// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  googleMapsApiKey: '',
  backend: 'http://localhost:4200', // Put your backend here
  firebase: {
    apiKey: 'AIzaSyB43AEAPGnHyfwaoP5KzCp9b9WCVyxxHfY',
    authDomain: 'botsparked.firebaseapp.com',
    databaseURL: 'https://botsparked.firebaseio.com',
    projectId: 'botsparked',
    storageBucket: 'botsparked.appspot.com',
    messagingSenderId: '899772049124',
  },
};
