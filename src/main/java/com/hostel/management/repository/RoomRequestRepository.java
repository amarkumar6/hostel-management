package com.hostel.management.repository;

import com.hostel.management.entity.RoomRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRequestRepository extends JpaRepository<RoomRequest, Long> {
    List<RoomRequest> findByStatus(String status);
    List<RoomRequest> findByStudentId(Long studentId);
    boolean existsByStudentIdAndStatus(Long studentId, String status);
}
