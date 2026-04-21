package com.hostel.management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Static mapping no longer strictly required due to controller-based serving,
    // but kept empty to allow for future global MVC customizations.
}
