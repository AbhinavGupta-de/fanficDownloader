package org.abhinavgpt.fanficdndbackend.service;

import org.abhinavgpt.fanficdndbackend.service.scrapper.Scrapper;
import org.abhinavgpt.fanficdndbackend.service.scrapper.ScrapperHelper;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;

public class FanficServiceImpl extends FanficService {

    @Override
    public ResponseEntity<InputStreamResource> getSingleChapter(String url) {
        Scrapper scrapper = ScrapperHelper.getScrapper(url);
        return scrapper.getSingleChapter(url);
    }

    @Override
    public ResponseEntity<InputStreamResource> getMultipleChapters(String url, int start, int end) {
        return null;
    }

    @Override
    public ResponseEntity<InputStreamResource> getEntireFanfic(String url) {
        return null;
    }

    @Override
    public ResponseEntity<InputStreamResource> getEntireSeries(String url) {
        return null;
    }
}
