package com.telusko.demo.exception;

/**
 * Exception for token-related errors.
 */
public class TokenException extends RuntimeException {
    
    public TokenException(String message) {
        super(message);
    }
    
    public TokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
