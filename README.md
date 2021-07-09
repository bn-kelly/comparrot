# Comparrot Chrome Extension
Comparrot automatically finds the cheapest prices in real-time as you shop!

## Build
Make sure you have node.js installed and run the command below:
```
npm install
```
- Development
  ```
  npm run build-watch
  ```
- Production
  ```
  npm run build
  ```
After you run the commands above, you will see the `dist` folder created.

## Testing in local
1. Open `chrome://extension/` in your google chrome and enable `Developer mode`.
2. Click `Load unpacked.`, and then choose the `dist` folder in the presented dialog.
3. Now you are able to use "Comparrot" extension.

## Prepare for submission
```
npm run build
npm run pack
```
Once you run the commands above, you should see the comparrot.zip in the root folder of the project.
