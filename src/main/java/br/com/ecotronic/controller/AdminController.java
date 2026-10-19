package br.com.ecotronic.controller;

import br.com.ecotronic.dto.DescarteDto;
import br.com.ecotronic.service.DescarteService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Painel de monitoramento — somente administradores (ver AdminInterceptor). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final DescarteService service;

    public AdminController(DescarteService service) {
        this.service = service;
    }

    @GetMapping("/descartes")
    public List<DescarteDto> descartes(@RequestParam(defaultValue = "2000") int limit) {
        return service.recentes(limit);
    }
}
