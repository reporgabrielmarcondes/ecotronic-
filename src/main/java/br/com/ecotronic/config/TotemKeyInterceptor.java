package br.com.ecotronic.config;

import br.com.ecotronic.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Endpoints do totem exigem o cabeçalho X-Totem-Key. */
@Component
public class TotemKeyInterceptor implements HandlerInterceptor {

    private final byte[] chaveEsperada;

    public TotemKeyInterceptor(AppProperties props) {
        this.chaveEsperada = props.totemKey().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true;

        String recebida = req.getHeader("X-Totem-Key");
        boolean ok = recebida != null
                && MessageDigest.isEqual(chaveEsperada, recebida.getBytes(StandardCharsets.UTF_8));
        if (!ok) throw new ApiException(HttpStatus.UNAUTHORIZED, "Totem não autorizado.");
        return true;
    }
}
