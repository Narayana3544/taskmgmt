package com.telusko.demo.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DateUtils {
    public static List<LocalDate> getWorkingDays(LocalDate start, LocalDate end) {
        List<LocalDate> workingDays = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                workingDays.add(date);
            }
        }
        return workingDays;
    }
}
