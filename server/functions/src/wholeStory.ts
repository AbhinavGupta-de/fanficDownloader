import * as functions from "firebase-functions";
import * as puppeteer from "puppeteer";

async function getHtmlContent(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  const content = await page.$eval("#workskin", (div) => div.innerHTML);
  await browser.close();
  return content;
}

async function downloadStoryContent(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });

    const entireWorkLink = await page.$("li.chapter.entire a");

    if (entireWorkLink) {
      const entireWorkUrl = await page.evaluate(
        (link) => link.getAttribute("href"),
        entireWorkLink,
      );
      if (!entireWorkUrl) {
        throw new Error("Entire Work link does not have a valid URL");
      }
      await page.goto(`https://archiveofourown.org${entireWorkUrl}`, {
        waitUntil: "networkidle2",
      });
    }

    const storyContent = await getHtmlContent(page.url());

    await page.setContent(storyContent);

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="font-size: 10px; text-align: center; width: 100%; display: flex;">Downloaded using fanfic downloader</div>',
      footerTemplate:
        '<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    });

    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to download story: ${error}`);
  } finally {
    await browser.close();
  }
}

export const downloadStory = functions.https.onRequest(async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).send("URL is required");
      return;
    }

    const storyContent = await downloadStoryContent(url);

    res.set("Content-Type", "application/pdf");
    res.send(storyContent);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.toString());
    } else {
      res.status(500).send("An unknown error occurred");
    }
  }
});
