package com.hostel.management.repository;

import com.hostel.management.entity.WaitingList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingList, Long> {
    Optional<WaitingList> findByStudentId(Long studentId);
    // Finds the first student in the waiting list based on created_at
    Optional<WaitingList> findFirstByOrderByCreatedAtAsc();
}
