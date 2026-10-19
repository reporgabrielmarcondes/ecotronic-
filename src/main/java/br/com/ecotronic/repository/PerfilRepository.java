package br.com.ecotronic.repository;

import br.com.ecotronic.model.Perfil;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerfilRepository extends JpaRepository<Perfil, UUID> {
    Optional<Perfil> findByToken(String token);
    boolean existsByToken(String token);
    Optional<Perfil> findByEmailIgnoreCase(String email);
}
