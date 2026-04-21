package com.hostel.management.config;

import com.hostel.management.entity.Room;
import com.hostel.management.entity.Student;
import com.hostel.management.entity.User;
import com.hostel.management.repository.RoomRepository;
import com.hostel.management.repository.StudentRepository;
import com.hostel.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Admin User
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = User.builder()
                    .name("Admin User")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .isAdmin(true)
                    .isApproved(true)
                    .role("admin")
                    .build();
            userRepository.save(admin);
        }

        // Seed some Rooms
        if (roomRepository.count() == 0) {
            Room r1 = Room.builder()
                    .roomNumber("101")
                    .hostelBlock("A")
                    .type("Double")
                    .capacity(2)
                    .floor("1")
                    .status("VACANT")
                    .build();
            Room r2 = Room.builder()
                    .roomNumber("102")
                    .hostelBlock("A")
                    .type("Single")
                    .capacity(1)
                    .floor("1")
                    .status("VACANT")
                    .build();
            Room r3 = Room.builder()
                    .roomNumber("201")
                    .hostelBlock("B")
                    .type("Triple")
                    .capacity(3)
                    .floor("2")
                    .status("VACANT")
                    .build();
            roomRepository.saveAll(Arrays.asList(r1, r2, r3));
        }

        // Seed some Students and their User accounts
        if (studentRepository.count() == 0) {
            // Student 1
            User u1 = User.builder()
                    .name("John Doe")
                    .email("john@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role("student")
                    .isApproved(true)
                    .build();
            u1 = userRepository.save(u1);

            Student s1 = Student.builder()
                    .name("John Doe")
                    .contact("1234567890")
                    .fatherContact("0987654321")
                    .category("General")
                    .city("New York")
                    .address("123 Main St")
                    .status("Active")
                    .blockNo("A")
                    .roomNo("101")
                    .userId(u1.getId())
                    .build();
            
            // Student 2
            User u2 = User.builder()
                    .name("Jane Smith")
                    .email("jane@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role("student")
                    .isApproved(true)
                    .build();
            u2 = userRepository.save(u2);

            Student s2 = Student.builder()
                    .name("Jane Smith")
                    .contact("2345678901")
                    .fatherContact("1098765432")
                    .category("OBC")
                    .city("Los Angeles")
                    .address("456 Elm St")
                    .status("Active")
                    .blockNo("A")
                    .roomNo("102")
                    .userId(u2.getId())
                    .build();
            
            studentRepository.saveAll(Arrays.asList(s1, s2));
        }
    }
}
