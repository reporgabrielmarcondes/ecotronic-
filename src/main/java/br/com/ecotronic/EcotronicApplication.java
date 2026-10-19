package br.com.ecotronic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EcotronicApplication {
    public static void main(String[] args) {
        SpringApplication.run(EcotronicApplication.class, args);
    }
}
