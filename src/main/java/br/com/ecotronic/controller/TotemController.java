package br.com.ecotronic.controller;

import br.com.ecotronic.dto.DescarteCriadoDto;
import br.com.ecotronic.dto.NovoDescarteRequest;
import br.com.ecotronic.dto.TokenRequest;
import br.com.ecotronic.service.DescarteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Rotas usadas pelo totem físico (autenticadas pelo cabeçalho X-Totem-Key). */
@RestController
@RequestMapping("/api/totem")
public class TotemController {

    private final DescarteService service;

    public TotemController(DescarteService service) {
        this.service = service;
    }

    @PostMapping("/validar-token")
    public Map<String, String> validarToken(@Valid @RequestBody TokenRequest req, HttpServletRequest http) {
        return Map.of("nome", service.nomeDoToken(req.token(), http.getRemoteAddr()));
    }

    @PostMapping("/descartes")
    public ResponseEntity<DescarteCriadoDto> registrar(@Valid @RequestBody NovoDescarteRequest req,
                                                       HttpServletRequest http) {
        DescarteCriadoDto criado = service.registrar(req.totemId(), req.categoria(), req.token(),
                http.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }
}
