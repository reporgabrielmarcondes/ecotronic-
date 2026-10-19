package br.com.ecotronic.service;

import br.com.ecotronic.dto.DescarteCriadoDto;
import br.com.ecotronic.dto.DescarteDto;
import br.com.ecotronic.exception.ApiException;
import br.com.ecotronic.model.Categoria;
import br.com.ecotronic.model.Descarte;
import br.com.ecotronic.model.Perfil;
import br.com.ecotronic.repository.DescarteRepository;
import br.com.ecotronic.repository.PerfilRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DescarteService {

    private final DescarteRepository descartes;
    private final PerfilRepository perfis;
    private final TentativasLimiter limiter;

    public DescarteService(DescarteRepository descartes, PerfilRepository perfis, TentativasLimiter limiter) {
        this.descartes = descartes;
        this.perfis = perfis;
        this.limiter = limiter;
    }

    /** Descobre o nome do dono de um código do totem (com limite de tentativas por IP). */
    @Transactional(readOnly = true)
    public String nomeDoToken(String token, String ip) {
        limiter.verificar(ip);
        return perfis.findByToken(token.trim())
                .map(Perfil::getNome)
                .orElseThrow(() -> {
                    limiter.registrarFalha(ip);
                    return new ApiException(HttpStatus.NOT_FOUND, "Código não encontrado.");
                });
    }

    /** Registra o descarte; o sorteio dos ecodots é feito aqui, no servidor. */
    @Transactional
    public DescarteCriadoDto registrar(String totemId, String categoriaId, String token, String ip) {
        Categoria categoria = Categoria.deId(categoriaId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Categoria inválida."));

        Perfil usuario = null;
        if (token != null && !token.isBlank()) {
            limiter.verificar(ip);
            usuario = perfis.findByToken(token.trim()).orElseThrow(() -> {
                limiter.registrarFalha(ip);
                return new ApiException(HttpStatus.NOT_FOUND, "Código não encontrado.");
            });
        }

        Descarte d = new Descarte(totemId.trim(), categoria, categoria.sortearEcodots(), usuario);
        return DescarteCriadoDto.de(descartes.save(d));
    }

    @Transactional(readOnly = true)
    public List<DescarteDto> recentes(int limite) {
        int n = Math.max(1, Math.min(limite, 5000));
        return descartes.buscarRecentes(PageRequest.of(0, n)).stream().map(DescarteDto::de).toList();
    }
}
