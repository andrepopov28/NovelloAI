# Novello AI V1 - End-to-End Smoke Test

This document outlines the manual steps to verify the critical path of the Novello AI web application after the V1 Refactor.

## 1. Authentication
- [ ] Open the application at `http://localhost:3000`.
- [ ] You should be redirected to the `/login` page if unauthenticated.
- [ ] Click the "Continue with Google" button.
- [ ] Complete the Google sign-in flow.
- [ ] Verify you are redirected to the Dashboard (`/app`).

## 2. Project Creation and Persistence
- [ ] On the Dashboard, click "New Project".
- [ ] Provide a valid Title, Genre, and Premise.
- [ ] Click "Create Project".
- [ ] Verify you are redirected to the Editor (`/project/[id]`).
- [ ] Refresh the page (Cmd/Ctrl + R).
- [ ] Verify that the project loads successfully and the title/details remain intact.

## 3. Chapter Creation and Editing
- [ ] In the Editor sidebar, click the "+" button to add a new chapter.
- [ ] Type some text into the editor for the new chapter.
- [ ] Wait for the "Saved" or "Cloud Synced" indicator to appear.
- [ ] Refresh the page.
- [ ] Verify that the chapter and its content are restored perfectly.

## 4. Offline Storage and Sync 
- [ ] While editing a chapter, disconnect your internet connection (turn off Wi-Fi).
- [ ] Add a new sentence to the chapter.
- [ ] Notice the status should change to "Offline Changes".
- [ ] Reconnect to the internet.
- [ ] The sync indicator should eventually update to "Cloud Synced".
- [ ] Refresh the page and verify the sentence added offline was persisted.

## 5. AI Content Generation (Mocked/Local)
- [ ] Place the cursor at the end of a sentence in the Editor.
- [ ] Click the `Sparkle` icon (Continue Writing) in the floating toolbar or side panel.
- [ ] Observe the loading state.
- [ ] Verify that AI-generated text is appended to your content.

## 6. Export Functionality
- [ ] In the Editor toolbar, select the "Export" menu.
- [ ] Click the "Print to PDF (HTML)" button.
- [ ] Verify that a toast notification appears: "Generating HTML for PDF print…".
- [ ] Verify that an HTML file is downloaded to your machine named `manuscript-[projectId].html`.
- [ ] Open the HTML file in a browser, trigger the print dialog (Cmd/Ctrl + P), and save as PDF.

## 7. Audiobook / Voice (Browser Native)
- [ ] Navigate to the "Audiobook" tab for your project.
- [ ] Confirm that "Browser Voice" is the only active TTS Provider.
- [ ] Click "Play". 
- [ ] Verify that the chapter text is read aloud using the browser's built-in synth voice.
