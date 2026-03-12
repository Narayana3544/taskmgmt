package com.telusko.demo.holiday.service;

import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.holiday.dto.HolidayRequest;
import com.telusko.demo.holiday.dto.HolidayResponse;
import com.telusko.demo.holiday.entity.Holiday;
import com.telusko.demo.holiday.repository.HolidayRepository;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final OrganizationRepository organizationRepository;

    public HolidayService(HolidayRepository holidayRepository, OrganizationRepository organizationRepository) {
        this.holidayRepository = holidayRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public List<HolidayResponse> getHolidaysByYear(Long orgId, int year) {
        return holidayRepository.findByOrganizationIdAndYear(orgId, year)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public HolidayResponse getHolidayById(Long id) {
        Holiday h = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", "id", id));
        return mapToResponse(h);
    }

    @Transactional
    public HolidayResponse createHoliday(HolidayRequest request) {
        Organization org = organizationRepository.findById(request.getOrgId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.getOrgId()));

        Holiday h = Holiday.builder()
                .organization(org)
                .name(request.getName())
                .date(request.getDate())
                .type(request.getType())
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
        h = holidayRepository.save(h);
        return mapToResponse(h);
    }

    @Transactional
    public HolidayResponse updateHoliday(Long id, HolidayRequest request) {
        Holiday h = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", "id", id));

        h.setName(request.getName());
        h.setDate(request.getDate());
        h.setType(request.getType());
        h.setDescription(request.getDescription());
        if (request.getActive() != null) {
            h.setActive(request.getActive());
        }

        h = holidayRepository.save(h);
        return mapToResponse(h);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday", "id", id);
        }
        holidayRepository.deleteById(id);
    }

    private HolidayResponse mapToResponse(Holiday h) {
        return HolidayResponse.builder()
                .id(h.getId())
                .orgId(h.getOrganization().getId())
                .name(h.getName())
                .date(h.getDate())
                .type(h.getType())
                .description(h.getDescription())
                .active(h.getActive())
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }
}
