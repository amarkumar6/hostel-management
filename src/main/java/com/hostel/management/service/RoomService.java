package com.hostel.management.service;

import com.hostel.management.entity.Allotment;
import com.hostel.management.entity.Room;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.WaitingList;
import com.hostel.management.repository.AllotmentRepository;
import com.hostel.management.repository.RoomRepository;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.repository.WaitingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final AllotmentRepository allotmentRepository;
    private final WaitingListRepository waitingListRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public void vacateStudent(Long allotmentId) {
        Allotment allotment = allotmentRepository.findById(allotmentId)
                .orElseThrow(() -> new RuntimeException("Allotment not found"));
        
        Room room = allotment.getRoom();
        Student student = allotment.getStudent();
        
        allotmentRepository.delete(allotment);

        // Clear student room info
        if (student != null) {
            student.setRoomNo("Pending");
            student.setBlockNo("Pending");
            studentRepository.save(student);
        }

        // Check occupancy and update room status
        Long occupancy = allotmentRepository.countByRoomId(room.getId());
        if (occupancy < room.getCapacity()) {
            room.setStatus("VACANT");
            roomRepository.save(room);
            
            // Check waiting list
            checkWaitingList(room);
        }
    }

    private void checkWaitingList(Room room) {
        Optional<WaitingList> firstInLine = waitingListRepository.findFirstByOrderByCreatedAtAsc();
        if (firstInLine.isPresent()) {
            // Here we can either automatically assign or notify admin.
            // Based on requirement "Assign to first student OR notify admin", 
            // I'll implement a simple notification or log for now, 
            // or we could auto-create a RoomRequest for this room.
            
            // Let's create a pending request for this student for the newly available room.
            // Actually, let's just log it for now and let the admin see the waiting list.
            System.out.println("Room " + room.getRoomNumber() + " is now available. First student in waiting list: " + 
                firstInLine.get().getStudent().getName());
        }
    }
}
