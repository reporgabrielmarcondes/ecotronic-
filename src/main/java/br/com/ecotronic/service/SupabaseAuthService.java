package br.com.ecotronic.service;

import br.com.ecotronic.config.AppProperties;
import br.com.ecotronic.exception.ApiException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Único ponto de contato com o Supabase: confirma, junto ao Supabase Auth, que o
 * access_token enviado pelo navegador é válido e descobre quem é o usuário.
 * (GET {SUPABASE_URL}/auth/v1/user)
 */
@Service
public class SupabaseAuthService {

    private static final long TTL_MS = 30_000; // cache curto para não consultar a cada requisição

    public record SupabaseUser(UUID id, String email) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UserResponse(String id, String email) {}

    private record Cached(SupabaseUser user, long expiraEm) {}

    private final RestClient http;
    private final String anonKey;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public SupabaseAuthService(AppProperties props) {
        this.http = RestClient.builder().baseUrl(props.supabase().url()).build();
        this.anonKey = props.supabase().anonKey();
    }

    public SupabaseUser validar(String accessToken) {
        long agora = System.currentTimeMillis();
        Cached c = cache.get(accessToken);
        if (c != null && c.expiraEm() > agora) return c.user();

        UserResponse r;
        try {
            r = http.get()
                    .uri("/auth/v1/user")
                    .header("apikey", anonKey)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(UserResponse.class);
        } catch (HttpClientErrorException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada. Entre novamente.");
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Não foi possível validar o login no Supabase.");
        }
        if (r == null || r.id() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sessão inválida ou expirada. Entre novamente.");
        }

        SupabaseUser user = new SupabaseUser(UUID.fromString(r.id()), r.email());
        if (cache.size() > 1000) cache.values().removeIf(x -> x.expiraEm() <= agora);
        cache.put(accessToken, new Cached(user, agora + TTL_MS));
        return user;
    }
}
