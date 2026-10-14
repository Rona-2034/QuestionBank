package com.extr.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final Path uploadDirectory;

    public WebConfig(@Value("${examxx.upload-dir}") String uploadDirectory) {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String legacyUploadLocation = "file:" + System.getProperty("user.dir")
                + java.io.File.separator + "webapps" + java.io.File.separator;
        registry.addResourceHandler("/files/**")
                .addResourceLocations(uploadDirectory.toUri().toString())
                .addResourceLocations(legacyUploadLocation);
    }
}
