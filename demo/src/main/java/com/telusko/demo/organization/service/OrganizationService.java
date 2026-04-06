package com.telusko.demo.organization.service;

import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.organization.dto.OrganizationRequest;
import com.telusko.demo.organization.dto.OrganizationResponse;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public OrganizationResponse getOrganization(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));
        return mapToResponse(org);
    }

    @Transactional
    public OrganizationResponse updateOrganization(Long id, OrganizationRequest request) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", id));
        
        org.setName(request.getName());
        org.setCode(request.getCode());
        org.setTimezone(request.getTimezone());
        org.setWorkingDays(request.getWorkingDays());
        org.setLogoUrl(request.getLogoUrl());

        org = organizationRepository.save(org);
        return mapToResponse(org);
    }

    private OrganizationResponse mapToResponse(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .code(org.getCode())
                .timezone(org.getTimezone())
                .workingDays(org.getWorkingDays())
                .logoUrl(org.getLogoUrl())
                .active(org.getActive())
                .build();
    }
}
