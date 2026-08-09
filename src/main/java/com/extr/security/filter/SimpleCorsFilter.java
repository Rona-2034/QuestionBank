package com.extr.security.filter;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashSet;
import java.util.Properties;
import java.util.Set;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class SimpleCorsFilter implements Filter {

    private static final String DEFAULT_ALLOWED_ORIGINS =
            "http://127.0.0.1:5173,http://localhost:5173";
    private Set<String> allowedOrigins = new LinkedHashSet<String>();

    public void init(FilterConfig filterConfig) throws ServletException {
        String configured = resolveConfiguredOrigins();
        String[] origins = configured.split(",");
        for (int i = 0; i < origins.length; i++) {
            String origin = origins[i] == null ? "" : origins[i].trim();
            if (origin.length() > 0) {
                allowedOrigins.add(origin);
            }
        }
    }

    public void doFilter(ServletRequest request, ServletResponse response,
            FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String origin = httpRequest.getHeader("Origin");

        if (origin != null && allowedOrigins.contains(origin)) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Vary", "Origin");
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Access-Control-Allow-Methods",
                    "GET,POST,PUT,DELETE,OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers",
                    "Content-Type,Accept,X-Requested-With,Origin");
            httpResponse.setHeader("Access-Control-Max-Age", "3600");
        }

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(request, response);
    }

    public void destroy() {
    }

    private String resolveConfiguredOrigins() {
        String configured = System.getProperty("app.cors.allowedOrigins");
        if (configured != null && configured.trim().length() > 0) {
            return configured.trim();
        }

        configured = System.getenv("APP_CORS_ALLOWED_ORIGINS");
        if (configured != null && configured.trim().length() > 0) {
            return configured.trim();
        }

        configured = loadProperty("application.properties",
                "app.cors.allowedOrigins");
        if (configured != null && configured.trim().length() > 0) {
            return configured.trim();
        }

        configured = loadProperty("application-test.properties",
                "app.cors.allowedOrigins");
        if (configured != null && configured.trim().length() > 0) {
            return configured.trim();
        }

        return DEFAULT_ALLOWED_ORIGINS;
    }

    private String loadProperty(String resourceName, String propertyName) {
        InputStream stream = null;
        try {
            stream = Thread.currentThread().getContextClassLoader()
                    .getResourceAsStream(resourceName);
            if (stream == null) {
                return null;
            }
            Properties properties = new Properties();
            properties.load(stream);
            return properties.getProperty(propertyName);
        } catch (IOException e) {
            return null;
        } finally {
            if (stream != null) {
                try {
                    stream.close();
                } catch (IOException e) {
                    // ignore close failures
                }
            }
        }
    }
}
