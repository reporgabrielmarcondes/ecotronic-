package br.com.ecotronic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** token é opcional: vazio = descarte sem identificação. */
public record NovoDescarteRequest(
        @NotBlank @Size(max = 50) String totemId,
        @NotBlank @Size(max = 30) String categoria,
        @Size(max = 20) String token) {}
