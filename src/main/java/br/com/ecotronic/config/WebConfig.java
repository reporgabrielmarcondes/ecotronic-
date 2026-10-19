package br.com.ecotronic.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SupabaseAuthInterceptor authInterceptor;
    private final AdminInterceptor adminInterceptor;
    private final TotemKeyInterceptor totemKeyInterceptor;

    public WebConfig(SupabaseAuthInterceptor authInterceptor,
                     AdminInterceptor adminInterceptor,
                     TotemKeyInterceptor totemKeyInterceptor) {
        this.authInterceptor = authInterceptor;
        this.adminInterceptor = adminInterceptor;
        this.totemKeyInterceptor = totemKeyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Usuário logado (token do Supabase): conta e painel admin.
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/perfis/**", "/api/admin/**")
                .order(1);
        // Além de logado, precisa ser administrador.
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns("/api/admin/**")
                .order(2);
        // Totem: chave própria no cabeçalho X-Totem-Key.
        registry.addInterceptor(totemKeyInterceptor)
                .addPathPatterns("/api/totem/**")
                .order(1);
    }

    // As telas podem ser abertas direto do disco (file://) ou de outro host.
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "OPTIONS")
                .allowedHeaders("*");
    }
}
