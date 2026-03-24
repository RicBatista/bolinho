package com.bolinhobacalhau.entity;

import com.bolinhobacalhau.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notification_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private NotificationType type;
    @Column(nullable = false, length = 20) private String phone;
    @Column(nullable = false, length = 2000) private String message;
    @Column(nullable = false) private LocalDateTime sentAt;
    private Boolean success;
    @Column(length = 500) private String errorMessage;

    @PrePersist public void prePersist() {
        if (sentAt == null) sentAt = LocalDateTime.now();
    }
}
