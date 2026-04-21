package com.hostel.management.controller;

import com.hostel.management.dto.AllotmentRequest;
import com.hostel.management.entity.Allotment;
import com.hostel.management.entity.Room;
import com.hostel.management.entity.Student;
import com.hostel.management.repository.AllotmentRepository;
import com.hostel.management.repository.RoomRepository;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.repository.UserRepository;
import com.hostel.management.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/allotments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AllotmentController {

    private final AllotmentRepository allotmentRepository;
    private final StudentRepository studentRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomService roomService;

    @GetMapping
    public List<Allotment> getAllAllotments() {
        log.info("Fetching all allotments");
        List<Allotment> allotments = allotmentRepository.findAll();
        log.info("Found {} allotments", allotments.size());
        return allotments;
    }

    @PostMapping
    public ResponseEntity<?> addAllotment(@RequestBody AllotmentRequest request) {
        log.info("Adding new allotment: studentId={}, roomId={}", request.getStudentId(), request.getRoomId());
        Optional<Student> studentOpt = studentRepository.findById(request.getStudentId());
        Optional<Room> roomOpt = roomRepository.findById(request.getRoomId());

        if (studentOpt.isPresent() && roomOpt.isPresent()) {
            Student student = studentOpt.get();
            Room room = roomOpt.get();
            
            Allotment allotment = Allotment.builder()
                    .student(student)
                    .room(room)
                    .build();
            Allotment savedAllotment = allotmentRepository.save(allotment);
            
            // Update student record with room info
            student.setRoomNo(room.getRoomNumber());
            student.setBlockNo(room.getHostelBlock());
            studentRepository.save(student);
            
            // Approve the corresponding user account if it exists
            if (student.getUserId() != null) {
                userRepository.findById(student.getUserId()).ifPresent(user -> {
                    user.setApproved(true);
                    userRepository.save(user);
                });
            }
            
            // Update room status if full
            Long occupancy = allotmentRepository.countByRoomId(room.getId());
            if (occupancy >= room.getCapacity()) {
                room.setStatus("Full");
                roomRepository.save(room);
            }
            
            log.info("Allotment added successfully with ID: {}", savedAllotment.getId());
            return ResponseEntity.ok(savedAllotment);
        }
        log.warn("Failed to add allotment: student or room not found");
        return ResponseEntity.status(404).body(Map.of("message", "Student or Room not found."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Allotment> getAllotmentById(@PathVariable Long id) {
        return allotmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllotment(@PathVariable Long id) {
        roomService.vacateStudent(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/vacate")
    public ResponseEntity<Void> vacateAllotment(@PathVariable Long id) {
        roomService.vacateStudent(id);
        return ResponseEntity.ok().build();
    }
}
