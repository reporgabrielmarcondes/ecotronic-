package br.com.ecotronic.dto;

import br.com.ecotronic.model.Descarte;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

/** Nomes em snake_case no JSON, iguais aos que as telas já usavam. */
public record DescarteDto(
        Long id,
        @JsonProperty("totem_id") String totemId,
        String categoria,
        @JsonProperty("categoria_nome") String categoriaNome,
        int ecodots,
        @JsonProperty("criado_em") Instant criadoEm,
        @JsonProperty("usuario_nome") String usuarioNome) {

    public static DescarteDto de(Descarte d) {
        return new DescarteDto(d.getId(), d.getTotemId(), d.getCategoria(), d.getCategoriaNome(),
                d.getEcodots(), d.getCriadoEm(),
                d.getUsuario() != null ? d.getUsuario().getNome() : null);
    }
}
