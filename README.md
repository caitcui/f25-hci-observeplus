# Observe+ Implementation Prototypes

This React Native project implements three **independent** prototype features for the Observe+ project:

- **Part 5**: onChange Events - Label selection with color change (`LabelSelection.js`)
- **Part 7**: localStorage Savings - Autosave functionality with AsyncStorage (`AutoSave.js`)
- **Part 9**: Signature Capture - Signature drawing and capture using react-native-signature-canvas (`SignatureCapture.js`)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Expo Go app on your iPhone

### Installation

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
# or
expo start
```

4. Run on iOS:
```bash
npm run ios
# or press 'i' in the Expo CLI
```

5. Or scan the QR code with Expo Go app on your iPhone

## Features

### Part 5: Label Selection (onChange Events) - `LabelSelection.js`
- **Standalone app** - runs independently
- Tap on labels to select/deselect them
- Selected labels change color from white to secondary color (#F4542C)
- Demonstrates onChange event handling through visual feedback
- Shows count of selected labels

### Part 7: AutoSave (localStorage) - `AutoSave.js`
- **Standalone app** - runs independently
- Type session notes in the text input
- Data is automatically saved every 3 seconds to AsyncStorage
- Saved data persists after app restart
- Visual indicator shows autosave status ("Autosave: ON" or "Saving...")
- Displays last saved timestamp
- Option to clear saved data

### Part 9: Signature Capture - `SignatureCapture.js`
- **Standalone app** - runs independently
- Draw signatures using touch/stylus
- Clear and save signature functionality
- Signature data is saved to AsyncStorage
- Uses react-native-signature-canvas library
- Success confirmation when signature is saved

## Style Guide Compliance

The apps follow the Observe+ style guide:
- **Primary Color**: #FFFFFF (white)
- **Secondary Color**: #F4542C (orange)
- **Accent Colors**: #E9C46A (yellow), #EFF6FF (light blue), #71717A (gray)
- **Typography**: Inter font family (medium, bold, semi-bold)
- **Icons**: Material UI icons from @expo/vector-icons

## Project Structure

```
.
├── LabelSelection.js      # Part 5: Standalone Label Selection app
├── AutoSave.js            # Part 7: Standalone AutoSave app
├── SignatureCapture.js    # Part 9: Standalone Signature Capture app
├── index.js               # Entry point - edit this to switch between apps
├── package.json           # Dependencies
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── metro.config.js       # Metro bundler configuration
└── README.md             # This file
```

## Running Individual Features

Each feature is completely independent. To run a specific feature:

1. Edit `index.js` and change the import:
   ```javascript
   import App from './LabelSelection';  // or './AutoSave' or './SignatureCapture'
   ```

2. Start Expo:
   ```bash
   npm start
   ```

3. Reload the app in Expo Go

## Dependencies

- `expo`: Expo framework
- `react-native`: React Native framework
- `@react-native-async-storage/async-storage`: For localStorage functionality
- `react-native-signature-canvas`: For signature capture
- `@expo/vector-icons`: Material UI icons
- `react-native-webview`: Required for signature canvas

## Testing on iPhone

1. Install Expo Go from the App Store
2. Edit `index.js` to import the desired app file
3. Run `npm start` or `expo start`
4. Scan the QR code with your iPhone camera or Expo Go app
5. The app will load on your iPhone

## Notes

- Each feature is a **standalone, independent app** in its own file
- No navigation between features - each runs independently
- Data persistence is handled through AsyncStorage (React Native's equivalent to localStorage)
- All apps are optimized for iPhone portrait orientation
- Each app includes the Observe+ branding and title
