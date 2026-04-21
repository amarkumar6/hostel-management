package com.hostel.management.controller;

import com.hostel.management.dto.AttendanceRequest;
import com.hostel.management.entity.Attendance;
import com.hostel.management.entity.Student;
import com.hostel.management.repository.AttendanceRepository;
import com.hostel.management.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    @GetMapping("/{date}")
    public ResponseEntity<List<Attendance>> getAttendanceByDate(@PathVariable String date) {
        log.info("Fetching attendance for date: {}", date);
        LocalDate localDate = LocalDate.parse(date);
        List<Attendance> attendanceList = attendanceRepository.findByDate(localDate);
        log.info("Returning {} attendance records", attendanceList.size());
        return ResponseEntity.ok(attendanceList);
    }

    @PostMapping
    public ResponseEntity<?> saveAttendance(@RequestBody AttendanceRequest request) {
        log.info("Saving attendance for date: {}", request.getDate());
        LocalDate localDate = LocalDate.parse(request.getDate());
        
        for (AttendanceRequest.AttendanceItem item : request.getAttendanceData()) {
            Optional<Student> studentOpt = studentRepository.findById(item.getStudentId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                Attendance attendance = attendanceRepository.findByStudentAndDate(student, localDate)
                        .orElse(Attendance.builder()
                                .student(student)
                                .date(localDate)
                                .build());
                
                attendance.setStatus(item.getStatus());
                attendance.setRemarks(item.getRemarks());
                attendanceRepository.save(attendance);
            }
        }

        return ResponseEntity.ok().build();
    }
}
