package com.hostel.management.repository;

import com.hostel.management.entity.Attendance;
import com.hostel.management.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByDate(LocalDate date);
    Optional<Attendance> findByStudentAndDate(Student student, LocalDate date);
}
