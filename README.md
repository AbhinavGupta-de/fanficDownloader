# fanfic downloader chrome extension

This is chrome extension that allows you to download fanfics from archiveofourown.org. It is a work in progress that's being developed by a single person. If you have any suggestions or feedback, feel free to open an issue or a pull request.

## Installation

You can directly install the extension from the [chrome web store](https://chromewebstore.google.com/detail/fanfiction-downloader/hbmlonlejahpphahalbcldboehhjieih)

Or if you want to install it manually, you can follow the steps below:

1. Clone the repository
2. Then go to the frontend folder by `cd frontend`
3. Run `npm install`
4. Run `npm run build`
5. Go to `chrome://extensions/` in your chrome browser
6. Enable developer mode
7. Click on `Load unpacked` and select the `dist` folder inside the `frontend` folder
8. The extension should now be installed

If you also want to run the backend yourself, then it's a bit more complicated as I am using appwrite serverless functions. So, there is no direct way to run the backend locally. But you can deploy the backend to your own appwrite server and change the endpoint in the `frontend/src/api/fetchSingleChapter.ts` and `frontend/src/api/fetchWholeStory.ts` files.

## Features

### v1.0.0

- Download a single chapter
- Download the whole story
- Download the story as a pdf
- Download the story from archiveofourown.org

### Upcoming features

- Download the story from fanfiction.net
- Download the story as an epub
- Website to report bugs and suggest features
- Download whole series from archiveofourown.org

## Contributing

If you want to contribute to the project, you can open an issue or a pull request. If you are opening a pull request, please try to follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

> [!TIP]
>
> > You can report bugs, suggest features or ask questions by opening an issue.

> [!NOTE]
>
> > A discord server will be created soon for the project. You can join it to discuss the project.
