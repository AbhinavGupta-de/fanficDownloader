# Backend Functions

This contains the backend functions for the server. These functions are built using Node.js with Javascript. The functions are deployed on Appwrite serverless functions.

## Functions

### 1. [Single Chapter Download](./singleChapterFunc/index.js)

This function is used to download a single chapter of a fanfiction in both PDF and EPUB formats.

### 2. [Multi Chapter Download](./multiChapterFunc/index.js)

This function is used to download a multi chapter of a fanfiction in both PDF and EPUB formats.

### 3. [Series Download](./seriesFunc/index.js)

This function is used to download a multi chapter of a fanfiction in both PDf and EPUB formats.

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/AbhinavGupta-de/fanficDownloader.git
cd server
```

2. Choose the function you want to work on

```bash
cd [functionYouWantToWork]
```

3. Install dependencies

```bash
npm install
```

4. Create a function on appwrite

5. Write test for your function in [test](../test)

6. Run the test

```bash
node --experimental-modules [your js file]
```

## Contributing

If you want to contribute to the project, you can open an issue or a pull request. If you are opening a pull request, please try to follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
