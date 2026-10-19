package br.com.ecotronic.config;

import br.com.ecotronic.exception.ApiException;
import br.com.ecotronic.service.SupabaseAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Exige "Authorization: Bearer <access_token do Supabase>" e guarda o usuário na requisição. */
@Component
public class SupabaseAuthInterceptor implements HandlerInterceptor {

    public static final String ATTR = "supabaseUser";

    private final SupabaseAuthService supabase;

    public SupabaseAuthInterceptor(SupabaseAuthService supabase) {
        this.supabase = supabase;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true; // pré-flight do CORS

        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ") || header.length() < 20) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para continuar.");
        }
        req.setAttribute(ATTR, supabase.validar(header.substring(7).trim()));
        return true;
    }
}
