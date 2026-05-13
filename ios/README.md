# LeaveANote iOS App

Native iOS app built with **Swift** and **SwiftUI** for creating and sharing time-locked messages.

## Requirements

- **macOS** with **Xcode 15+**
- iOS 16.0+ deployment target
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) (for generating the Xcode project)
- Firebase account with Firestore and Storage enabled

## Quick Setup

### 1. Install XcodeGen

```bash
brew install xcodegen
```

### 2. Generate Xcode Project

```bash
cd ios/
xcodegen generate
```

This creates `LeaveANote.xcodeproj` from `project.yml`.

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (or use the existing web app project)
3. Add an **iOS app** with bundle ID `com.leaveanote.LeaveANote`
4. Download `GoogleService-Info.plist` and replace the placeholder in `LeaveANote/`
5. Enable **Firestore Database** and **Storage**

### 4. Open in Xcode

```bash
open LeaveANote.xcodeproj
```

Xcode will automatically resolve Swift Package Manager dependencies (Firebase iOS SDK).

### 5. Run

Select a simulator or device → press **Cmd+R**.

## Architecture

- **SwiftUI** with **MVVM** pattern
- **CryptoKit** for AES-GCM encryption (compatible with the web app)
- **Firebase iOS SDK** via Swift Package Manager
- **Native QR code** generation with `CIFilter.qrCodeGenerator()`
- **PhotosPicker** for media attachments

## Project Structure

```
ios/
├── project.yml                    ← XcodeGen configuration
├── LeaveANote/
│   ├── LeaveANoteApp.swift        ← App entry point
│   ├── ContentView.swift          ← Root navigation
│   ├── GoogleService-Info.plist   ← Firebase config (replace with yours)
│   ├── Assets.xcassets/           ← App icon, accent color
│   ├── Models/
│   │   └── Note.swift             ← Data models
│   ├── Services/
│   │   ├── FirebaseService.swift  ← Firestore + Storage operations
│   │   └── EncryptionService.swift← AES-GCM encryption
│   ├── ViewModels/
│   │   ├── CreateNoteViewModel.swift
│   │   ├── ViewNoteViewModel.swift
│   │   └── ManageNoteViewModel.swift
│   ├── Views/
│   │   ├── CreateNoteView.swift
│   │   ├── ViewNoteView.swift
│   │   ├── ManageNoteView.swift
│   │   ├── CountdownTimerView.swift
│   │   ├── ShareResultView.swift
│   │   └── Components/
│   │       └── MediaGalleryView.swift
│   └── Utils/
│       ├── Helpers.swift
│       └── Validation.swift
```

## Features

All features from the web app, built natively for iOS:

- Time-locked messages with countdown/specific date
- Client-side AES-GCM encryption (compatible with web app)
- Photo/video attachments via native PhotosPicker
- QR code generation (CoreImage)
- Native iOS share sheet
- Real-time note subscription via Firestore
- Sender control panel (edit/delete)
- Deep linking support
