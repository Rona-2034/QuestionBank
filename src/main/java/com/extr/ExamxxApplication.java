package com.extr;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.extr.persistence")
@EnableCaching
@EnableScheduling
public class ExamxxApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamxxApplication.class, args);
    }
}
