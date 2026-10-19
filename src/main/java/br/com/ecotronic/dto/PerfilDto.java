package br.com.ecotronic.dto;

import br.com.ecotronic.model.Perfil;
import java.util.UUID;

public record PerfilDto(UUID id, String nome, String token, boolean admin) {
    public static PerfilDto de(Perfil p) {
        return new PerfilDto(p.getId(), p.getNome(), p.getToken(), p.isAdmin());
    }
}
