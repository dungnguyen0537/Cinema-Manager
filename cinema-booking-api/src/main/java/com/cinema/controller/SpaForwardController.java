package com.cinema.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping("/")
    public String index() {
        return "forward:/landing.html";
    }

    @GetMapping({"/home", "/movies/**", "/showtimes/**", "/cinemas/**", "/my-tickets/**", "/booking/**"})
    public String spaRoutes() {
        return "forward:/app.html";
    }

    @GetMapping({"/admin", "/admin/**"})
    public String adminRoutes() {
        return "forward:/admin.html";
    }
}
