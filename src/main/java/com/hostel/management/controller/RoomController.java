package com.hostel.management.controller;

import com.hostel.management.entity.Room;
import com.hostel.management.repository.AllotmentRepository;
import com.hostel.management.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RoomController {

    private final RoomRepository roomRepository;
    private final AllotmentRepository allotmentRepository;

    @GetMapping
    public List<Room> getAllRooms() {
        log.info("Fetching all rooms");
        List<Room> rooms = roomRepository.findAll().stream().map(room -> {
            room.setOccupancyCount(allotmentRepository.countByRoomId(room.getId()));
            return room;
        }).collect(Collectors.toList());
        log.info("Found {} rooms", rooms.size());
        return rooms;
    }

    @GetMapping({"/vacant", "/available"})
    public List<Room> getAvailableRooms() {
        log.info("Fetching available rooms");
        List<Room> rooms = roomRepository.findAvailableRooms().stream().map(room -> {
            room.setOccupancyCount(allotmentRepository.countByRoomId(room.getId()));
            return room;
        }).collect(Collectors.toList());
        log.info("Found {} available rooms", rooms.size());
        return rooms;
    }

    @PostMapping
    public ResponseEntity<Room> addRoom(@RequestBody Room room) {
        log.info("Adding new room: {}", room.getRoomNumber());
        if (room.getStatus() == null) {
            room.setStatus("VACANT");
        }
        if (room.getCapacity() == null) {
            room.setCapacity(1); // Default to 1 if not provided
        }
        Room savedRoom = roomRepository.save(room);
        savedRoom.setOccupancyCount(0L);
        log.info("Room added successfully with ID: {}", savedRoom.getId());
        return ResponseEntity.ok(savedRoom);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(room -> {
                    room.setOccupancyCount(allotmentRepository.countByRoomId(room.getId()));
                    return ResponseEntity.ok(room);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Long id) {
        Long occupancy = allotmentRepository.countByRoomId(id);
        if (occupancy > 0) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Room is currently occupied and cannot be deleted."));
        }
        roomRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
