package com.extr.config;

import org.apache.ibatis.plugin.Interceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.extr.util.MyInterceptor;

@Configuration
public class MyBatisConfig {
    @Bean
    public Interceptor pagingInterceptor() {
        return new MyInterceptor();
    }
}