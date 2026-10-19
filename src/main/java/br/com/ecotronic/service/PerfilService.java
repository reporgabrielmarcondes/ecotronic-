package br.com.ecotronic.service;

import br.com.ecotronic.config.AppProperties;
import br.com.ecotronic.dto.DescarteDto;
import br.com.ecotronic.dto.PerfilDto;
import br.com.ecotronic.exception.ApiException;
import br.com.ecotronic.model.Perfil;
import br.com.ecotronic.repository.DescarteRepository;
import br.com.ecotronic.repository.PerfilRepository;
import br.com.ecotronic.service.SupabaseAuthService.SupabaseUser;
import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final PerfilRepository perfis;
    private final DescarteRepository descartes;
    private final AppProperties props;

    public PerfilService(PerfilRepository perfis, DescarteRepository descartes, AppProperties props) {
        this.perfis = perfis;
        this.descartes = descartes;
        this.props = props;
    }

    /** Cria o perfil do usuário do Supabase (ou devolve o que já existe). */
    @Transactional
    public PerfilDto criar(SupabaseUser user, String nome) {
        Optional<Perfil> existente = perfis.findById(user.id());
        if (existente.isPresent()) return PerfilDto.de(existente.get());

        boolean admin = user.email() != null && props.adminEmails().stream()
                .anyMatch(e -> e.trim().equalsIgnoreCase(user.email()));
        Perfil novo = new Perfil(user.id(), nome.trim(), user.email(), gerarTokenUnico(), admin);
        return PerfilDto.de(perfis.save(novo));
    }

    @Transactional(readOnly = true)
    public PerfilDto buscar(UUID id) {
        return PerfilDto.de(obter(id));
    }

    @Transactional
    public PerfilDto atualizarNome(UUID id, String nome) {
        Perfil p = obter(id);
        p.setNome(nome.trim());
        return PerfilDto.de(perfis.save(p));
    }

    @Transactional
    public PerfilDto regenerarToken(UUID id) {
        Perfil p = obter(id);
        p.setToken(gerarTokenUnico());
        return PerfilDto.de(perfis.save(p));
    }

    @Transactional(readOnly = true)
    public List<DescarteDto> descartesDoUsuario(UUID id) {
        return descartes.findByUsuario_IdOrderByCriadoEmDesc(id).stream().map(DescarteDto::de).toList();
    }

    private Perfil obter(UUID id) {
        return perfis.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Perfil não encontrado."));
    }

    /** 6 dígitos numéricos (fácil de digitar no totem), sorteados com SecureRandom. */
    private String gerarTokenUnico() {
        for (int i = 0; i < 20; i++) {
            String token = String.valueOf(100000 + RANDOM.nextInt(900000));
            if (!perfis.existsByToken(token)) return token;
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível gerar um código único.");
    }
}
