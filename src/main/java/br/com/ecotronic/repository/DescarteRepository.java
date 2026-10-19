package br.com.ecotronic.repository;

import br.com.ecotronic.model.Descarte;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DescarteRepository extends JpaRepository<Descarte, Long> {

    List<Descarte> findByUsuario_IdOrderByCriadoEmDesc(UUID usuarioId);

    /** Mais recentes primeiro, já trazendo o usuário (evita N+1 consultas). */
    @Query("select d from Descarte d left join fetch d.usuario order by d.criadoEm desc")
    List<Descarte> buscarRecentes(Pageable pageable);
}
