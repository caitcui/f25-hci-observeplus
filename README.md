# f25-hci-observeplus
cis 4210 hci final project Observe+

This project has 9 different technical implementations which each independently have code that can be run locally to visualize the intended purpose. 

## Hello World App & Styles, Custom Input
This is a React Native demo app.
To see preview,
### install expo cli
```bash
npm install -g expo-cli
```
### create project
```bash
npx create-expo-app ObservePlus --template blank
cd ObservePlus
```
### replace App.js with the provided App.js
### run the app
```bash
npx expo start
```
### On iPhone (recommended platform)
press `i` after start
1. install "Expo Go"
2. scan QR code in the terminal with iPhone camera
3. App will open in Expo Go

**Web**
press `w` in terminal can opens in default browser

## Calendar, Dropdown, LocalStorage
AI had help in organizing the calendar and appointment creation/deletion formatting as well as for helping understand what react tools would be best for a dropdown for react-native-dropdown-picker.

## Parts 5, 7, 9: Label Selection, AutoSave, and Signature Capture

This React Native project implements three **independent** prototype features for the Observe+ project:

- **Part 5**: onChange Events - Label selection with color change (`LabelSelection.js`)
- **Part 7**: localStorage Savings - Autosave functionality with AsyncStorage (`AutoSave.js`)
- **Part 9**: Signature Capture - Signature drawing and capture using react-native-signature-canvas (`SignatureCapture.js`)

### Setup for Parts 5, 7, 9

1. Install dependencies:
```bash
npm install
```

2. To run a specific feature, edit `index.js` and change the import:
   - For Part 5: Change `import App from './LabelSelection';` in `index.js`
   - For Part 7: Change `import App from './AutoSave';` in `index.js`
   - For Part 9: Change `import App from './SignatureCapture';` in `index.js`

3. Start the Expo development server:
```bash
npm start
```

### Part 5: Label Selection (onChange Events)
- Tap on labels to select/deselect them
- Selected labels change color from white to orange (#F4542C)
- Demonstrates onChange event handling through visual feedback
- Shows count of selected labels

### Part 7: AutoSave (localStorage)
- Type session notes in the text input
- Data is automatically saved every 3 seconds to AsyncStorage
- Saved data persists after app restart
- Visual indicator shows autosave status

### Part 9: Signature Capture
- Draw signatures using touch/stylus
- Clear and save signature functionality
- Signature data is saved to AsyncStorage
- Uses react-native-signature-canvas library
