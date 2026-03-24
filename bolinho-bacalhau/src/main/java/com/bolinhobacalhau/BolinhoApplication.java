package com.bolinhobacalhau;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BolinhoApplication {
    public static void main(String[] args) {
        SpringApplication.run(BolinhoApplication.class, args);
    }
}
