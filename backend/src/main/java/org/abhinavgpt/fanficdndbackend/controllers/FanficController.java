package org.abhinavgpt.fanficdndbackend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ffdnd")
public class FanficController {

    @PostMapping("")
    public ResponseEntity<?> createFanfic() {

    }

}
