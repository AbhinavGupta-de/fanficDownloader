declare module 'epub-gen' {
  interface EpubContent {
    title: string;
    data: string;
    author?: string;
    filename?: string;
    excludeFromToc?: boolean;
    beforeToc?: boolean;
  }

  interface EpubOptions {
    title: string;
    author?: string;
    publisher?: string;
    cover?: string;
    content: EpubContent[];
    css?: string;
    fonts?: string[];
    lang?: string;
    tocTitle?: string;
    appendChapterTitles?: boolean;
    customOpfTemplatePath?: string;
    customNcxTocTemplatePath?: string;
    customHtmlTocTemplatePath?: string;
  }

  class Epub {
    constructor(options: EpubOptions, output: string);
    promise: Promise<void>;
  }

  export = Epub;
}
