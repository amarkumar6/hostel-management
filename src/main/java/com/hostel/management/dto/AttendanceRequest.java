package com.hostel.management.dto;

import lombok.Data;
import java.util.List;

@Data
public class AttendanceRequest {
    private String date;
    private List<AttendanceItem> attendanceData;

    @Data
    public static class AttendanceItem {
        private Long studentId;
        private String status;
        private String remarks;
    }
}
