package br.com.ecotronic.controller;

import br.com.ecotronic.config.SupabaseAuthInterceptor;
import br.com.ecotronic.dto.DescarteDto;
import br.com.ecotronic.dto.NomeRequest;
import br.com.ecotronic.dto.PerfilDto;
import br.com.ecotronic.service.PerfilService;
import br.com.ecotronic.service.SupabaseAuthService.SupabaseUser;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Conta do usuário logado ("Minha Conta"). Todas as rotas exigem token do Supabase. */
@RestController
@RequestMapping("/api/perfis")
public class PerfilController {

    private final PerfilService service;

    public PerfilController(PerfilService service) {
        this.service = service;
    }

    /** Chamado logo após o cadastro no Supabase: cria o perfil e gera o código do totem. */
    @PostMapping
    public ResponseEntity<PerfilDto> criar(
            @RequestAttribute(SupabaseAuthInterceptor.ATTR) SupabaseUser user,
            @Valid @RequestBody NomeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(user, req.nome()));
    }

    @GetMapping("/me")
    public PerfilDto me(@RequestAttribute(SupabaseAuthInterceptor.ATTR) SupabaseUser user) {
        return service.buscar(user.id());
    }

    @PutMapping("/me")
    public PerfilDto atualizar(
            @RequestAttribute(SupabaseAuthInterceptor.ATTR) SupabaseUser user,
            @Valid @RequestBody NomeRequest req) {
        return service.atualizarNome(user.id(), req.nome());
    }

    @PostMapping("/me/token")
    public PerfilDto novoToken(@RequestAttribute(SupabaseAuthInterceptor.ATTR) SupabaseUser user) {
        return service.regenerarToken(user.id());
    }

    @GetMapping("/me/descartes")
    public List<DescarteDto> meusDescartes(@RequestAttribute(SupabaseAuthInterceptor.ATTR) SupabaseUser user) {
        return service.descartesDoUsuario(user.id());
    }
}
