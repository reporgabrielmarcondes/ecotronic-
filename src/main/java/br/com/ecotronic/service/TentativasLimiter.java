package br.com.ecotronic.service;

import br.com.ecotronic.exception.ApiException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Freio contra tentativa-e-erro nos códigos de 6 dígitos:
 * após 10 códigos errados em 1 minuto, o IP fica bloqueado até a janela esvaziar.
 */
@Component
public class TentativasLimiter {

    private static final int MAX_FALHAS = 10;
    private static final long JANELA_MS = 60_000;

    private final Map<String, Deque<Long>> falhasPorIp = new ConcurrentHashMap<>();

    public void verificar(String ip) {
        Deque<Long> falhas = falhasPorIp.get(ip);
        if (falhas == null) return;
        synchronized (falhas) {
            limpar(falhas);
            if (falhas.size() >= MAX_FALHAS) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Muitas tentativas incorretas. Aguarde um minuto.");
            }
        }
    }

    public void registrarFalha(String ip) {
        Deque<Long> falhas = falhasPorIp.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (falhas) {
            limpar(falhas);
            falhas.addLast(System.currentTimeMillis());
        }
    }

    private void limpar(Deque<Long> falhas) {
        long corte = System.currentTimeMillis() - JANELA_MS;
        while (!falhas.isEmpty() && falhas.peekFirst() < corte) falhas.pollFirst();
    }
}
