package br.com.ecotronic.config;

import br.com.ecotronic.exception.ApiException;
import br.com.ecotronic.model.Perfil;
import br.com.ecotronic.repository.PerfilRepository;
import br.com.ecotronic.service.SupabaseAuthService.SupabaseUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Roda depois do SupabaseAuthInterceptor: só deixa passar quem tem is_admin = true. */
@Component
public class AdminInterceptor implements HandlerInterceptor {

    private final PerfilRepository perfis;

    public AdminInterceptor(PerfilRepository perfis) {
        this.perfis = perfis;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true;

        SupabaseUser user = (SupabaseUser) req.getAttribute(SupabaseAuthInterceptor.ATTR);
        boolean admin = user != null && perfis.findById(user.id()).map(Perfil::isAdmin).orElse(false);
        if (!admin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
        return true;
    }
}
