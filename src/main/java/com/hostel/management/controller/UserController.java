package com.hostel.management.controller;

import com.hostel.management.dto.LoginRequest;
import com.hostel.management.dto.LoginResponse;
import com.hostel.management.dto.UserApprovalRequest;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.User;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.security.JwtUtils;
import com.hostel.management.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class UserController {

    private final UserService userService;
    private final StudentRepository studentRepository;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        log.info("Received registration request for email: {}", user.getEmail());
        User registeredUser = userService.registerUser(user);
        log.info("Successfully registered user: {}", registeredUser.getEmail());
        return ResponseEntity.ok(registeredUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        log.info("Received login request for email: {}", loginRequest.getEmail());
        return userService.findByEmail(loginRequest.getEmail())
                .map(user -> {
                    if (!user.isApproved() && !user.isAdmin()) {
                        log.warn("Login forbidden: account not approved for email: {}", user.getEmail());
                        return ResponseEntity.status(403).body(Map.of("message", "Your account is not approved yet."));
                    }
                    if (!userService.checkPassword(loginRequest.getPassword(), user.getPassword())) {
                        log.warn("Login failed: invalid password for email: {}", user.getEmail());
                        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
                    }
                    String token = jwtUtils.generateToken(user.getEmail());
                    log.info("Login successful for email: {}", user.getEmail());
                    return ResponseEntity.ok(new LoginResponse(
                            user.getId(),
                            user.getName(),
                            user.getEmail(),
                            user.isAdmin(),
                            user.getRole(),
                            token
                    ));
                })
                .orElseGet(() -> {
                    log.warn("Login failed: user not found for email: {}", loginRequest.getEmail());
                    return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
                });
    }

    @GetMapping("/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        return ResponseEntity.ok(userService.getPendingUsers());
    }

    @GetMapping("/admin/students")
    public ResponseEntity<List<User>> getRegisteredStudents() {
        log.info("Fetching all registered students from users table");
        List<User> students = userService.getUsersByRole("student");
        log.info("Found {} registered students", students.size());
        return ResponseEntity.ok(students);
    }

    @PostMapping("/{userId}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long userId, @RequestBody UserApprovalRequest request) {
        Optional<User> userOpt = userService.approveUser(userId);
        if (userOpt.isPresent()) {
            Optional<Student> studentOpt = studentRepository.findById(request.getStudentId());
            if (studentOpt.isPresent()) {
                Student student = studentOpt.get();
                student.setUserId(userId);
                studentRepository.save(student);
                return ResponseEntity.ok(Map.of("message", "User approved and linked to student record."));
            }
            return ResponseEntity.status(404).body(Map.of("message", "Student record not found."));
        }
        return ResponseEntity.status(404).body(Map.of("message", "User not found."));
    }

    @PostMapping("/{userId}/reject")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId) {
        userService.rejectUser(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/room")
    public ResponseEntity<?> getMyRoom(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String email = jwtUtils.extractUsername(token.substring(7));
            return userService.findByEmail(email).map(user -> {
                if (user.isAdmin()) {
                    return ResponseEntity.ok(Map.of("role", "admin"));
                }
                Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
                if (studentOpt.isPresent()) {
                    Student s = studentOpt.get();
                    return ResponseEntity.ok(Map.of(
                            "linked", true,
                            "roomNo", s.getRoomNo(),
                            "blockNo", s.getBlockNo(),
                            "studentName", s.getName(),
                            "status", s.getStatus()
                    ));
                }
                return ResponseEntity.ok(Map.of(
                        "linked", false,
                        "message", "Your account is approved but not linked to any student profile yet."
                ));
            }).orElse(ResponseEntity.status(401).build());
        }
        return ResponseEntity.status(401).build();
    }
}
