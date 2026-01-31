declare module 'puppeteer-extra' {
  import type { Browser, PuppeteerLaunchOptions } from 'puppeteer';
  import type { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';

  interface PuppeteerExtra {
    use(plugin: PuppeteerExtraPlugin): PuppeteerExtra;
    launch(options?: PuppeteerLaunchOptions): Promise<Browser>;
  }

  const puppeteer: PuppeteerExtra;
  export default puppeteer;
}
