package br.com.ecotronic.model;

import java.util.Arrays;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

/** Categorias de resíduo e a faixa de ecodots sorteada a cada descarte. */
public enum Categoria {
    CELULAR("celular", "Celular", 50, 80),
    NOTEBOOK("notebook", "Notebook", 150, 250),
    PCI("pci", "Placa de circuito (PCI)", 100, 150),
    COMPONENTES("componentes", "Componentes eletrônicos", 30, 60),
    BATERIA("bateria", "Bateria comum", 40, 70),
    LITIO("litio", "Bateria de lítio", 60, 100),
    ELETRO("eletro", "Eletrodoméstico pequeno", 80, 120),
    CABOS("cabos", "Cabos e fios", 20, 40),
    LAMPADAS("lampadas", "Lâmpadas", 15, 30),
    OUTROS("outros", "Outros resíduos", 10, 25);

    private final String id;
    private final String nome;
    private final int min;
    private final int max;

    Categoria(String id, String nome, int min, int max) {
        this.id = id;
        this.nome = nome;
        this.min = min;
        this.max = max;
    }

    public String getId() { return id; }
    public String getNome() { return nome; }

    /** Sorteia entre min e max, arredondando para múltiplos de 5. */
    public int sortearEcodots() {
        double bruto = ThreadLocalRandom.current().nextDouble() * (max - min) + min;
        return (int) (Math.round(bruto / 5.0) * 5);
    }

    public static Optional<Categoria> deId(String id) {
        return Arrays.stream(values()).filter(c -> c.id.equals(id)).findFirst();
    }
}
