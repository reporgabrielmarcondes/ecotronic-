package br.com.ecotronic.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ecotronic")
public record AppProperties(Supabase supabase, String totemKey, List<String> adminEmails) {

    public record Supabase(String url, String anonKey) {}

    public List<String> adminEmails() {
        return adminEmails == null ? List.of() : adminEmails;
    }
}
