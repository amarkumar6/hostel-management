package com.hostel.management.repository;

import com.hostel.management.entity.Allotment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AllotmentRepository extends JpaRepository<Allotment, Long> {
    Long countByRoomId(Long roomId);
}
