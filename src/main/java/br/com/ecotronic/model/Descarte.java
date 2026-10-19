package br.com.ecotronic.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "descartes", indexes = {
        @Index(name = "idx_descartes_criado_em", columnList = "criado_em"),
        @Index(name = "idx_descartes_usuario", columnList = "usuario_id")
})
public class Descarte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "totem_id", nullable = false, length = 50)
    private String totemId;

    @Column(nullable = false, length = 30)
    private String categoria;

    @Column(name = "categoria_nome", nullable = false, length = 100)
    private String categoriaNome;

    @Column(nullable = false)
    private int ecodots;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();

    /** Nulo quando o descarte foi feito sem identificação ("Pular"). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Perfil usuario;

    protected Descarte() {}

    public Descarte(String totemId, Categoria categoria, int ecodots, Perfil usuario) {
        this.totemId = totemId;
        this.categoria = categoria.getId();
        this.categoriaNome = categoria.getNome();
        this.ecodots = ecodots;
        this.usuario = usuario;
    }

    public Long getId() { return id; }
    public String getTotemId() { return totemId; }
    public String getCategoria() { return categoria; }
    public String getCategoriaNome() { return categoriaNome; }
    public int getEcodots() { return ecodots; }
    public Instant getCriadoEm() { return criadoEm; }
    public Perfil getUsuario() { return usuario; }
}
