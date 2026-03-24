package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.AppUser;
import com.bolinhobacalhau.enums.UserRole;
import com.bolinhobacalhau.repository.UserRepository;
import com.bolinhobacalhau.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
@Tag(name = "Autenticação")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Data public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }
    @Data @AllArgsConstructor public static class LoginResponse {
        private String token; private String username; private String fullName; private String role;
    }
    @Data public static class CreateUserRequest {
        @NotBlank private String username;
        @NotBlank private String password;
        @NotBlank private String fullName;
        private UserRole role = UserRole.CAIXA;
    }
    @Data @AllArgsConstructor public static class UserResponse {
        private Long id; private String username; private String fullName; private String role; private Boolean active;
    }

    @PostMapping("/login")
    @Operation(summary = "Login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        AppUser user = userRepository.findByUsername(req.getUsername())
            .orElseThrow(() -> new UsernameNotFoundException("Não encontrado"));
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name()));
    }

    @GetMapping("/me")
    @Operation(summary = "Usuário logado")
    public ResponseEntity<UserResponse> me(Authentication auth) {
        AppUser u = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(), u.getActive()));
    }

    @PostMapping("/usuarios")
    @PreAuthorize("hasRole('DONO')")
    @Operation(summary = "Criar usuário (DONO)")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) return ResponseEntity.badRequest().build();
        AppUser u = userRepository.save(AppUser.builder()
            .username(req.getUsername()).password(passwordEncoder.encode(req.getPassword()))
            .fullName(req.getFullName()).role(req.getRole()).active(true).build());
        return ResponseEntity.status(201).body(new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(), u.getActive()));
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasRole('DONO')")
    @Operation(summary = "Listar usuários (DONO)")
    public ResponseEntity<List<UserResponse>> list() {
        return ResponseEntity.ok(userRepository.findAll().stream()
            .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(), u.getActive()))
            .collect(Collectors.toList()));
    }

    @PatchMapping("/usuarios/{id}/desativar")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(u -> { u.setActive(false); userRepository.save(u); });
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/usuarios/{id}/senha")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody LoginRequest req) {
        userRepository.findById(id).ifPresent(u -> { u.setPassword(passwordEncoder.encode(req.getPassword())); userRepository.save(u); });
        return ResponseEntity.noContent().build();
    }
}
