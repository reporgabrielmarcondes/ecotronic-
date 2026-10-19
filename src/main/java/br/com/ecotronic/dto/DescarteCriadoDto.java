package br.com.ecotronic.dto;

import br.com.ecotronic.model.Descarte;

public record DescarteCriadoDto(Long id, String categoria, String categoriaNome, int ecodots) {
    public static DescarteCriadoDto de(Descarte d) {
        return new DescarteCriadoDto(d.getId(), d.getCategoria(), d.getCategoriaNome(), d.getEcodots());
    }
}
