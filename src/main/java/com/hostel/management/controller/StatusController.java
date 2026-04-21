package com.hostel.management.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
@Slf4j
public class StatusController {

    @GetMapping
    public ResponseEntity<Map<String, String>> getStatus() {
        log.info("Status check requested");
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "Hostel Management System API is running");
        return ResponseEntity.ok(status);
    }
}
