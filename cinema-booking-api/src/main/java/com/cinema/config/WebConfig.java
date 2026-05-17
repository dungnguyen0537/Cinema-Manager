package com.cinema.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");

        // Phục vụ các file đã tải lên — sử dụng đường dẫn tuyệt đối để khớp với FileUploadController
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String resourceLocation = uploadPath.toUri().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Các đường dẫn frontend của SPA -> chuyển tiếp đến app.html
        String[] spaRoutes = {
            "/home", "/movies", "/movie", "/seats", "/booking",
            "/my-tickets", "/cinemas", "/showtimes", "/profile"
        };
        for (String route : spaRoutes) {
            registry.addViewController(route).setViewName("forward:/app.html");
        }

        // Các đường dẫn trang quản trị -> chuyển tiếp đến admin.html
        registry.addViewController("/admin").setViewName("forward:/admin.html");
        registry.addViewController("/admin/").setViewName("forward:/admin.html");
    }
}
