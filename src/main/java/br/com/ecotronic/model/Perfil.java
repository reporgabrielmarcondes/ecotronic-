package br.com.ecotronic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Perfil do usuário. O id é o mesmo UUID do usuário no Supabase Auth. */
@Entity
@Table(name = "perfis")
public class Perfil {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(length = 255)
    private String email;

    /** Código de 6 dígitos que o usuário digita no totem. */
    @Column(nullable = false, unique = true, length = 6)
    private String token;

    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected Perfil() {}

    public Perfil(UUID id, String nome, String email, String token, boolean admin) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.token = token;
        this.admin = admin;
    }

    public UUID getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public boolean isAdmin() { return admin; }
    public void setAdmin(boolean admin) { this.admin = admin; }
    public Instant getCriadoEm() { return criadoEm; }
}
