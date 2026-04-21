package com.hostel.management.controller;

import com.hostel.management.entity.RoomRequest;
import com.hostel.management.entity.WaitingList;
import com.hostel.management.service.RoomRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RoomRequestController {

    private final RoomRequestService roomRequestService;

    @GetMapping
    public List<RoomRequest> getAllRequests() {
        log.info("Fetching all room requests");
        List<RoomRequest> requests = roomRequestService.getAllRequests();
        log.info("Found {} requests", requests.size());
        return requests;
    }

    @GetMapping("/pending")
    public List<RoomRequest> getPendingRequests() {
        log.info("Fetching pending room requests");
        List<RoomRequest> requests = roomRequestService.getRequestsByStatus("PENDING");
        log.info("Found {} pending requests", requests.size());
        return requests;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitRequest(@RequestBody Map<String, Long> payload) {
        Long studentId = payload.get("studentId");
        Long roomId = payload.get("roomId");
        log.info("Received room request: studentId={}, roomId={}", studentId, roomId);
        String message = roomRequestService.requestRoom(studentId, roomId);
        log.info("Request submission result: {}", message);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Long requestId) {
        String message = roomRequestService.approveRequest(requestId);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long requestId) {
        String message = roomRequestService.rejectRequest(requestId);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @GetMapping("/waiting-list")
    public List<WaitingList> getWaitingList() {
        return roomRequestService.getWaitingList();
    }

    @GetMapping("/student/{studentId}")
    public List<RoomRequest> getRequestsByStudentId(@PathVariable Long studentId) {
        return roomRequestService.getRequestsByStudentId(studentId);
    }

    @GetMapping("/student/{studentId}/has-pending")
    public ResponseEntity<Boolean> hasPendingRequest(@PathVariable Long studentId) {
        return ResponseEntity.ok(roomRequestService.hasPendingRequest(studentId));
    }
}
