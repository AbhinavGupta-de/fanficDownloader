package org.abhinavgpt.fanficdndbackend.service;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;

public interface FanficService {

    public ResponseEntity<InputStreamResource> getSingleChapter(String url);

    public ResponseEntity<InputStreamResource> getMultipleChapters(String url, int start, int end);

    public ResponseEntity<InputStreamResource> getEntireFanfic(String url);

    public ResponseEntity<InputStreamResource> getEntireSeries(String url);
}
