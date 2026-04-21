package com.hostel.management.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String address = "";

    @Builder.Default
    private String category = "General";

    @Builder.Default
    private String city = "";

    @Builder.Default
    private String contact = "";

    @Column(name = "father_contact")
    @Builder.Default
    private String fatherContact = "";

    @Builder.Default
    private String image = "default-student.png";

    @Column(name = "room_no")
    @Builder.Default
    private String roomNo = "Pending";

    @Column(name = "block_no")
    @Builder.Default
    private String blockNo = "Pending";

    @Column(nullable = false)
    @Builder.Default
    private String status = "Active";

    @Column(name = "user_id")
    private Long userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
