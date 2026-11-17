package com.extr.config;

import com.extr.security.LegacyAuthenticationProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            LegacyAuthenticationProvider legacyAuthenticationProvider) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .authenticationProvider(legacyAuthenticationProvider)
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"result\":\"unauthenticated\",\"messageInfo\":\"登录已失效，请重新登录\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"result\":\"forbidden\",\"messageInfo\":\"当前账号没有此操作权限\"}");
                        }))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .maximumSessions(1))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/app/auth/**", "/app/**", "/files/**", "/error").permitAll()
                        .requestMatchers("/api/app/admin/admins", "/api/app/admin/admins/**",
                                "/api/app/admin/system-config", "/api/app/admin/system-config/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/app/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/app/student/**").hasAnyRole("STUDENT", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/app/**").authenticated()
                        .anyRequest().permitAll())
                .build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }
}
