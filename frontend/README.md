# Fanfic Downloader

This is chrome extension that allows you to download fanfics from archiveofourown.org. It is a work in progress that's being developed by a single person. If you have any suggestions or feedback, feel free to open an issue or a pull request.

## Architecture

This is the frontend part of the extension. The backend part is in the [backend](../backend) folder. The frontend is built using Vite + React + Tailwind and the backend is built using appwrite serverless functions.

```
src/
  /api
     /appwriteFunctions.js         // Calls necessary functions using type and site name
     /fetchSingleChapter.js       // Calls the single chapter downloading function for Ao3
     /fetchWholeStory.js           // Calls the whole story downloading function for Ao3
  /assets
     /...                           // Contains the assets like images, fonts, etc.
  /main
     /Download.tsx                  // Handles the downloading component of the extension
     /Footer.tsx                    // Handles the footer section
     /Header.tsx                    // Displays the logo and name of the extension
     /Main.tsx                      // Fetches the story name, displays it, and other main functionalities
  /App.tsx                          // Main application component
  /background.ts                    // Background script for the extension
  /content.ts                       // Content script for the extension
  /main.tsx                         // Entry point for the React application
  /index.css                        // Global CSS styles
.gitignore                          // Git ignore file
index.html                          // Main HTML file
public/
  /...                              // Contains static assets like logos
  /manifest.json                    // Chrome extension manifest file
vite.config.js                      // Vite configuration file
tailwind.config.js                  // Tailwind CSS configuration file
package.json                        // NPM package file
```

## Contributing

If you want to contribute to the project, you can open an issue or a pull request. If you are opening a pull request, please try to follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

### Getting Started

To get started with the development of this Chrome extension:

1. Clone the repository:

```bash
Copy code
git clone <repository-url>
cd <repository-directory>
```

2. Install dependencies:

```bash
Copy code
npm install
```

3. Run the development server:

```bash
Copy code
npm run dev
```

4. Build the extension:

```bash
Copy code
npm run build
```

5. Load the extension in Chrome:
6. Open Chrome and go to chrome://extensions/.
7. Enable "Developer mode".
8. Click on "Load unpacked" and select the dist directory.

This will load your Chrome extension and you can start using it for development and testing.
