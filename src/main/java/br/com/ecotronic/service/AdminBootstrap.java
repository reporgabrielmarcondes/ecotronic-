package br.com.ecotronic.service;

import br.com.ecotronic.config.AppProperties;
import br.com.ecotronic.repository.PerfilRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Na inicialização, promove a administrador os perfis cujo e-mail está em ecotronic.admin-emails. */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final PerfilRepository perfis;
    private final AppProperties props;

    public AdminBootstrap(PerfilRepository perfis, AppProperties props) {
        this.perfis = perfis;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String email : props.adminEmails()) {
            if (email == null || email.isBlank()) continue;
            perfis.findByEmailIgnoreCase(email.trim()).ifPresent(p -> {
                if (!p.isAdmin()) {
                    p.setAdmin(true);
                    perfis.save(p);
                    log.info("Perfil '{}' promovido a administrador.", p.getNome());
                }
            });
        }
    }
}
