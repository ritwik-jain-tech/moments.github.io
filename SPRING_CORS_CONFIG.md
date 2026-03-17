# Spring Backend CORS Configuration

## Problem
The backend at `https://momentsbackend-673332237675.us-central1.run.app` is not allowing requests from `https://admin.moments.live`.

**Specific Issue**: The bulk upload endpoint `/api/files/bulk-upload-moments-with-details` is failing with CORS errors, while the single upload endpoint `/api/files/upload` works fine. This indicates that the bulk upload endpoint specifically needs CORS configuration.

## Solution

You need to configure CORS in your Spring Boot backend to allow requests from the frontend origin.

### Option 1: Using WebMvcConfigurer (Recommended)

Create or update a configuration class in your Spring Boot backend:

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://admin.moments.live")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### Option 2: Using @CrossOrigin Annotation

Add the annotation to your controller class or specific endpoints:

```java
@CrossOrigin(origins = {"https://admin.moments.live"}, 
             allowedHeaders = {"*"}, 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, 
                      RequestMethod.DELETE, RequestMethod.OPTIONS, RequestMethod.PATCH})
@RestController
@RequestMapping("/api")
public class YourController {
    // Your endpoints
}
```

### Option 3: Global CORS Configuration with CorsConfigurationSource

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("https://admin.moments.live"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}
```

## Important Notes

1. **Bulk Upload Endpoint**: The bulk upload endpoint `/api/files/bulk-upload-moments-with-details` specifically needs CORS configuration. If using `WebMvcConfigurer` with `/api/**` mapping, this should cover it. If using `@CrossOrigin` on individual methods, make sure to add it to the bulk upload controller method.

2. **Multiple Origins**: If you need to support multiple origins (e.g., localhost for development), you can add them:
   ```java
   .allowedOrigins("https://admin.moments.live", "http://localhost:3000", "http://localhost:5173")
   ```

3. **Credentials**: If you're using cookies or authentication headers, make sure `allowCredentials(true)` is set.

4. **Preflight Requests**: The `OPTIONS` method must be included in `allowedMethods` for CORS preflight requests to work. Bulk uploads may trigger preflight requests due to custom headers.

5. **Security**: For production, be specific about allowed origins rather than using `"*"` for security reasons.

## Testing

After deploying the changes, test the CORS configuration by:
1. Making a request from `https://admin.moments.live` to your backend
2. Checking the browser console for CORS errors
3. Verifying the `Access-Control-Allow-Origin` header in the response

## Deployment

After making these changes:
1. Rebuild your Spring Boot application
2. Redeploy to Google Cloud Run
3. Verify the CORS headers are present in the API responses

