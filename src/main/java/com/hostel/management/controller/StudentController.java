package com.hostel.management.controller;

import com.hostel.management.entity.Room;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.User;
import com.hostel.management.repository.RoomRepository;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.security.JwtUtils;
import com.hostel.management.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
@Slf4j
public class StudentController {

    public StudentController(StudentRepository studentRepository, RoomRepository roomRepository, JwtUtils jwtUtils, UserService userService) {
        this.studentRepository = studentRepository;
        this.roomRepository = roomRepository;
        this.jwtUtils = jwtUtils;
        this.userService = userService;
    }

    private final StudentRepository studentRepository;
    private final RoomRepository roomRepository;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    @Value("${upload.dir:uploads/}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path path = Paths.get(uploadDir);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
                log.info("Created upload directory at: {}", path.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Could not create upload directory", e);
        }
    }

    @GetMapping("/image/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename);
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                log.warn("Image not found or not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            log.error("Error serving image: {}", filename, e);
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            log.error("Error determining content type for image: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test-ping")
    public ResponseEntity<String> testPing() {
        return ResponseEntity.ok("StudentController is active");
    }

    @GetMapping("/{id:\\d+}/upload")
    public ResponseEntity<String> testUploadReach(@PathVariable("id") Long id) {
        return ResponseEntity.ok("Upload endpoint for student " + id + " is reachable via GET");
    }

    @GetMapping("")
    public List<Student> getAllStudents() {
        log.info("Fetching all students");
        return studentRepository.findAll();
    }

    @PostMapping("")
    public ResponseEntity<Student> addStudent(@RequestBody Student student) {
        log.info("Adding new student: {}", student.getName());
        return ResponseEntity.ok(studentRepository.save(student));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable("id") Long id) {
        log.info("Fetching student by ID: {}", id);
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Student> getStudentByUserId(@PathVariable("userId") Long userId) {
        log.info("Fetching student by User ID: {}", userId);
        return studentRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/room")
    public ResponseEntity<?> getStudentRoom(@RequestHeader("Authorization") String token) {
        log.info("API: Fetching room for token");
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        String email = jwtUtils.extractUsername(token.substring(7));
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
        
        // Resilience: auto-link or create profile
        if (studentOpt.isEmpty()) {
            List<Student> studentsByName = studentRepository.findAll().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(user.getName()) && s.getUserId() == null)
                    .toList();
            if (!studentsByName.isEmpty()) {
                Student s = studentsByName.get(0);
                s.setUserId(user.getId());
                studentOpt = Optional.of(studentRepository.save(s));
            } else {
                Student newStudent = Student.builder()
                        .name(user.getName())
                        .contact(user.getContact())
                        .userId(user.getId())
                        .status("Active")
                        .build();
                studentOpt = Optional.of(studentRepository.save(newStudent));
            }
        }

        Student student = studentOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("linked", true);
        response.put("studentId", student.getId());
        response.put("studentName", student.getName());

        String roomNo = student.getRoomNo();
        String blockNo = student.getBlockNo();

        if (roomNo == null || blockNo == null || "Pending".equalsIgnoreCase(roomNo)) {
            response.put("hasRoom", false);
            return ResponseEntity.ok(response);
        }

        Optional<Room> roomOpt = roomRepository.findByRoomNumberAndHostelBlock(roomNo, blockNo);
        response.put("hasRoom", true);
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            response.put("roomNumber", room.getRoomNumber());
            response.put("block", room.getHostelBlock());
            response.put("type", room.getType());
            response.put("status", student.getStatus());
        } else {
            response.put("roomNumber", roomNo);
            response.put("block", blockNo);
            response.put("type", "Unknown");
            response.put("status", student.getStatus());
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable("id") Long id) {
        log.info("Deleting student ID: {}", id);
        studentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/{id}/profile", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> updateProfile(@PathVariable("id") Long id, @RequestBody Map<String, Object> updates) {
        log.info("API CALL: Update profile for student ID: {}", id);
        try {
            Optional<Student> studentOpt = studentRepository.findById(id);
            if (studentOpt.isEmpty()) {
                log.warn("Student not found for update: {}", id);
                return ResponseEntity.status(404).body(Map.of("message", "Student not found with ID " + id));
            }
            
            Student student = studentOpt.get();
            if (updates.containsKey("contact")) student.setContact((String) updates.get("contact"));
            if (updates.containsKey("fatherContact")) student.setFatherContact((String) updates.get("fatherContact"));
            if (updates.containsKey("address")) student.setAddress((String) updates.get("address"));
            if (updates.containsKey("city")) student.setCity((String) updates.get("city"));
            if (updates.containsKey("category")) student.setCategory((String) updates.get("category"));
            
            Student saved = studentRepository.save(student);
            log.info("Profile updated successfully for ID: {}", id);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error updating profile for ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/{id}/upload", consumes = "multipart/form-data", produces = "application/json")
    public ResponseEntity<?> uploadImage(@PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
        log.info("API CALL: Image upload for student ID: {}", id);
        log.info("File: {}, Size: {}", file.getOriginalFilename(), file.getSize());
        
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file uploaded or file is empty"));
            }

            // Simple type check
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Only image files are allowed"));
            }

            Optional<Student> studentOpt = studentRepository.findById(id);
            if (studentOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Student not found"));
            }

            // Ensure upload directory exists
            Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created directory: {}", uploadPath);
            }

            // Save file
            String originalFileName = file.getOriginalFilename();
            String extension = originalFileName != null && originalFileName.contains(".") 
                    ? originalFileName.substring(originalFileName.lastIndexOf(".")) : ".jpg";
            
            String fileName = "student_" + id + "_" + System.currentTimeMillis() + extension;
            Path filePath = uploadPath.resolve(fileName);
            
            log.info("Saving file to: {}", filePath);
            Files.copy(file.getInputStream(), filePath);

            // Update student record
            Student student = studentOpt.get();
            // Store the path using our new guaranteed API endpoint
            String imageUrl = "/api/students/image/" + fileName;
            student.setImage(imageUrl);
            studentRepository.save(student);
            
            log.info("Upload successful for ID: {}. Image URL: {}", id, imageUrl);
            return ResponseEntity.ok(Map.of(
                "imageUrl", imageUrl,
                "message", "Upload successful"
            ));
        } catch (IOException e) {
            log.error("Upload error for ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not upload file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error for ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Unexpected error: " + e.getMessage()));
        }
    }
}
