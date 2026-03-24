package com.bolinhobacalhau.security;

import com.bolinhobacalhau.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Separado do SecurityConfig para evitar dependência circular:
 * SecurityConfig → JwtAuthFilter → UserDetailsService → SecurityConfig
 */
@Configuration
@RequiredArgsConstructor
public class UserDetailsServiceConfig {

    private final UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));
    }
}
