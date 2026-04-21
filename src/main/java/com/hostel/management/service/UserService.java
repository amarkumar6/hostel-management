package com.hostel.management.service;

import com.hostel.management.entity.Student;
import com.hostel.management.entity.User;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(User user) {
        log.info("Registering user: {}", user.getEmail());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setApproved(true); // Auto-approved for now based on requirements
        user.setRole(user.isAdmin() ? "admin" : "student");
        User savedUser = userRepository.save(user);
        log.info("User registered successfully with ID: {}", savedUser.getId());

        // Create a corresponding student record if not admin
        if (!savedUser.isAdmin()) {
            log.info("Creating student record for user: {}", savedUser.getName());
            Student student = Student.builder()
                    .name(savedUser.getName())
                    .contact(savedUser.getContact())
                    .userId(savedUser.getId())
                    .status("Active")
                    .build();
            studentRepository.save(student);
            log.info("Student record created for user ID: {}", savedUser.getId());
        }

        return savedUser;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public List<User> getPendingUsers() {
        return userRepository.findByIsApprovedFalse();
    }

    public List<User> getUsersByRole(String role) {
        List<User> users = userRepository.findByRole(role);
        
        // If searching for students, only return those who don't have a room allotted yet
        if ("student".equalsIgnoreCase(role)) {
            return users.stream()
                    .filter(user -> {
                        Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
                        // If student record exists and room is still "Pending", keep them in the list
                        return studentOpt.isPresent() && "Pending".equalsIgnoreCase(studentOpt.get().getRoomNo());
                    })
                    .toList();
        }
        return users;
    }

    public Optional<User> approveUser(Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setApproved(true);
            return userRepository.save(user);
        });
    }

    public void rejectUser(Long userId) {
        userRepository.deleteById(userId);
    }
}
