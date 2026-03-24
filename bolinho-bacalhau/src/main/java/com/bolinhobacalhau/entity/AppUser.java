package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Entity @Table(name = "app_users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AppUser implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true) private String username;
    @Column(nullable = false) private String password;
    @Column(nullable = false) private String fullName;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private UserRole role;
    @Column(nullable = false) private Boolean active = true;

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return Boolean.TRUE.equals(active); }
}
