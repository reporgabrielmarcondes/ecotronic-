package br.com.ecotronic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NomeRequest(@NotBlank @Size(max = 100) String nome) {}
