package com.hostel.management.service;

import com.hostel.management.entity.Room;
import com.hostel.management.entity.RoomRequest;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.WaitingList;
import com.hostel.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomRequestService {

    private final RoomRequestRepository roomRequestRepository;
    private final WaitingListRepository waitingListRepository;
    private final RoomRepository roomRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    public List<RoomRequest> getAllRequests() {
        return roomRequestRepository.findAll();
    }

    public List<RoomRequest> getRequestsByStatus(String status) {
        return roomRequestRepository.findByStatus(status);
    }

    public List<RoomRequest> getRequestsByStudentId(Long studentId) {
        return roomRequestRepository.findByStudentId(studentId);
    }

    public boolean hasPendingRequest(Long studentId) {
        return roomRequestRepository.existsByStudentIdAndStatus(studentId, "PENDING");
    }

    @Transactional
    public String requestRoom(Long studentId, Long roomId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // If the student already has a pending request, don't allow another one.
        if (hasPendingRequest(studentId)) {
            return "You already have a pending request.";
        }

        // Check if any rooms are available in general
        List<Room> availableRooms = roomRepository.findAvailableRooms();
        if (availableRooms.isEmpty()) {
            // Add to waiting list automatically
            if (waitingListRepository.findByStudentId(studentId).isPresent()) {
                return "You are already on the waiting list.";
            }
            WaitingList waitingListEntry = WaitingList.builder()
                    .student(student)
                    .build();
            waitingListRepository.save(waitingListEntry);
            return "No rooms available. You have been added to the waiting list.";
        }

        // If roomId is provided, try to request that specific room
        Room room;
        if (roomId != null) {
            room = roomRepository.findById(roomId)
                    .orElseThrow(() -> new RuntimeException("Room not found"));
        } else {
            // Request the first available room
            room = availableRooms.get(0);
        }

        String status = (room.getStatus() != null) ? room.getStatus().toUpperCase() : "";
        if (!status.equals("VACANT") && !status.equals("AVAILABLE")) {
            return "Room is no longer available.";
        }

        RoomRequest request = RoomRequest.builder()
                .student(student)
                .room(room)
                .status("PENDING")
                .build();
        roomRequestRepository.save(request);
        return "Room request submitted for approval.";
    }

    @Transactional
    public String approveRequest(Long requestId) {
        RoomRequest request = roomRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getStatus().equals("PENDING")) {
            return "Request is already processed.";
        }

        Room room = request.getRoom();
        String currentStatus = (room.getStatus() != null) ? room.getStatus().toUpperCase() : "";
        if (!currentStatus.equals("VACANT") && !currentStatus.equals("AVAILABLE")) {
            request.setStatus("REJECTED");
            roomRequestRepository.save(request);
            return "Room is no longer available. Request rejected.";
        }

        // Update request status
        request.setStatus("APPROVED");
        roomRequestRepository.save(request);

        // Link student to room
        Student student = request.getStudent();
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

        // Update room status
        room.setStatus("Full");
        roomRepository.save(room);

        // Remove from waiting list if present
        waitingListRepository.findByStudentId(student.getId()).ifPresent(waitingListRepository::delete);

        return "Request approved and room allocated.";
    }

    @Transactional
    public String rejectRequest(Long requestId) {
        RoomRequest request = roomRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getStatus().equals("PENDING")) {
            return "Request is already processed.";
        }

        request.setStatus("REJECTED");
        roomRequestRepository.save(request);
        return "Request rejected.";
    }

    public List<WaitingList> getWaitingList() {
        return waitingListRepository.findAll();
    }
}
