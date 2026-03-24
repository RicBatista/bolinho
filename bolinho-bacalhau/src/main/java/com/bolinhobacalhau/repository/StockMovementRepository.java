package com.bolinhobacalhau.repository;

import com.bolinhobacalhau.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findBySale_Id(Long saleId);
}
