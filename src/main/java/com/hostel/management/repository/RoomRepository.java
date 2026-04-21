package com.hostel.management.repository;

import com.hostel.management.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByStatus(String status);
    Optional<Room> findByRoomNumberAndHostelBlock(String roomNumber, String hostelBlock);
    
    @Query("SELECT r FROM Room r WHERE UPPER(r.status) IN ('VACANT', 'AVAILABLE')")
    List<Room> findAvailableRooms();
}
