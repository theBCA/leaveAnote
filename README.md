# LeaveANote - Time-Locked Messages

A beautiful web application for creating and sharing time-locked messages. Send messages that can only be revealed at a specific time in the future.

## Features

- ✨ **Time-Locked Messages**: Create messages that unlock at a specific date/time or after a countdown
- 📸 **Media Attachments**: Include images and videos (up to 10MB each)
- 🔒 **Client-Side Encryption**: Messages are encrypted before storage
- 📱 **QR Code Sharing**: Generate shareable QR codes for easy distribution
- ⏱️ **Real-Time Countdown**: Live countdown timer until reveal
- 🎉 **Reveal Animation**: Beautiful animation when the message unlocks
- 📊 **Sender Control Panel**: Edit or delete notes before they're revealed
- 🌍 **Timezone Support**: Automatic timezone detection and conversion
- 📲 **Responsive Design**: Works perfectly on mobile and desktop
- 🎨 **Modern UI**: Clean, gradient-based design with smooth animations

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore + Storage)
- **Routing**: React Router v6
- **QR Codes**: qrcode.react
- **File Upload**: react-dropzone
- **Date Handling**: date-fns

## Prerequisites

- Node.js 20.19+ or 22.12+ (recommended)
- npm or yarn
- Firebase account

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

See detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

Quick summary:
1. Create Firebase project
2. Enable Firestore Database and Storage
3. Copy Firebase config

### 3. Environment Variables

```bash
cp .env.example .env
```

Fill in your Firebase credentials in `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Usage

### Creating a Note

1. Write your message (max 5000 characters)
2. Upload media files (optional)
3. Set unlock time (countdown or specific date/time)
4. Click "Create Note"
5. Share the link or QR code with recipient
6. Save your control link for management

### Viewing a Note

1. Open recipient link
2. See countdown timer
3. Wait for automatic reveal
4. View message and media

### Managing Your Note

1. Open control link (from creation)
2. View status and countdown
3. Edit message (if still pending)
4. Delete note (if still pending)
5. See when recipient opened it

## Project Structure

```
leaveanote/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks
│   ├── services/        # Firebase services
│   ├── utils/           # Utilities
│   ├── types/           # TypeScript types
│   └── config/          # Configuration
├── public/
├── .env                 # Your config (not committed)
├── .env.example         # Example config
└── README.md
```

## Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Deployment

### Firebase Hosting (Recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Other Platforms

- **Vercel**: Auto-deploy from Git
- **Netlify**: Build command: `npm run build`
- **GitHub Pages**: Use gh-pages package

## Security Notes

⚠️ **Important**:
- Client-side encryption is basic protection, not enterprise-grade
- Sender tokens control access - keep control links private
- No user authentication - anyone with link can access
- Implement auto-deletion for old notes (see FIREBASE_SETUP.md)

## Troubleshooting

### Node Version Issues
Update to Node.js 20.19+ or 22.12+

### Firebase Connection
1. Check `.env` credentials
2. Verify Firebase services are enabled
3. Check security rules are set
4. See browser console for errors

### File Upload Issues
- Check file size (max 10MB)
- Verify supported format
- Check Storage rules
- Ensure Storage is enabled

## Future Enhancements

- [ ] Push notifications
- [ ] Email delivery
- [ ] Cloud Functions auto-deletion
- [ ] User accounts
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Audio messages
- [ ] Reply functionality

## Contributing

Contributions welcome! Please submit a Pull Request.

## License

MIT License

## Support

Open an issue on GitHub for questions or bugs.

---

Built with ❤️ using React, TypeScript, and Firebase

