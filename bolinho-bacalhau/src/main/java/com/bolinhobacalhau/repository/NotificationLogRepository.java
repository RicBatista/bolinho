package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.NotificationLog;
import com.bolinhobacalhau.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findTop20ByOrderBySentAtDesc();
    Optional<NotificationLog> findTopByTypeAndPhoneAndSentAtAfterOrderBySentAtDesc(
            NotificationType type, String phone, LocalDateTime after);
}
