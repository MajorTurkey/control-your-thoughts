# Imaging Bay

Imaging Bay makes one picture from a sentence. The plate is the look. The words are only what is in the frame.

Live: [imaging-bay.vercel.app](https://imaging-bay.vercel.app)

Install on Android: [imaging-bay-7.apk](https://imaging-bay.vercel.app/imaging-bay-7.apk)

## Use it

1. Open the bay and tap **Enter**.
2. Choose a plate (Photograph, Cinema, Field, and the rest) and a frame.
3. Write only what is in the frame. Extra lines can say what is missing, what should be different, or what to leave out.
4. Tap **Expose**. A turkey walks in the frame while the plate is made.
5. Tap **Save**. The file goes to the folder you picked.

There is no account. Google and X sign-in are not used. Descriptions you have already exposed stay on this device, under **Log**. Tap one to put it back in the box.

A new plate needs a connection. The desk, the log, and a plate already on screen stay when the line is down.

## Save folder

Pick **Downloads**, **Pictures**, **Documents**, or **Camera** before you save. The phone app writes into that public folder.

That choice is in version 7 of the app. Install the link above over an older copy. The site and the app are the same bay; the install file is only the window on the phone.

## Project

The site is a TanStack Start app. The Android app in `android/` is a WebView around the live site, plus a download listener that saves plates on the device.

```bash
npm install
npm run dev
```

The dev server listens on port 8080.

```bash
npm run typecheck
npm test
npm run build
```

Image generation uses the server key `XAI_API_KEY`. Do not put that key in the app or in this file.
