package org.abhinavgpt.fanficdndbackend.exception;

public class SiteNotSupportedException extends RuntimeException{
    public SiteNotSupportedException(String message) {
        super(message);
    }
}
