package org.abhinavgpt.fanficdndbackend.service.scrapper;

import org.abhinavgpt.fanficdndbackend.exception.SiteNotSupportedException;

public class ScrapperHelper {
    public static Scrapper getScrapper(String url) {
        if (url.contains("fanfiction.net")) {
            return new FanfictionScrapper();
        } else if (url.contains("archiveofourown.org")) {
            return new ArchiveOfOurOwnScrapper();
        } else {
           throw new SiteNotSupportedException("Site not supported");
        }
    }
}
