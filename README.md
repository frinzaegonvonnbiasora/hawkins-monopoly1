<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Hawkins Monopoly (Firebase Hosting + Realtime Database)

This app is deployed as a static Firebase Hosting site and uses Firebase Realtime Database for multiplayer sync.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app locally:
   `npm run dev`

## Deploy to Firebase

1. Build the app:
   `npm run build`
2. Deploy hosting and database rules:
   `npx firebase deploy --only hosting,database`
