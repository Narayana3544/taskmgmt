package com.telusko.demo.role.service;

import com.telusko.demo.common.exception.BadRequestException;
import com.telusko.demo.common.exception.ResourceNotFoundException;
import com.telusko.demo.organization.entity.Organization;
import com.telusko.demo.organization.repository.OrganizationRepository;
import com.telusko.demo.role.dto.RoleRequest;
import com.telusko.demo.role.dto.RoleResponse;
import com.telusko.demo.role.entity.Role;
import com.telusko.demo.role.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;

    public RoleService(RoleRepository roleRepository, OrganizationRepository organizationRepository) {
        this.roleRepository = roleRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponse> getRolesByOrganization(Long orgId) {
        return roleRepository.findByOrganizationIdAndActiveTrue(orgId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByOrganizationIdAndCode(request.getOrganizationId(), request.getCode().toUpperCase())) {
            throw new BadRequestException("Role code already exists in this organization");
        }
        Organization org = organizationRepository.findById(request.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", request.getOrganizationId()));

        String name = request.getDisplayName() != null ? request.getDisplayName() : request.getName();
        if (name == null || name.trim().isEmpty()) {
            name = request.getCode();
        }

        Role role = Role.builder()
                .organization(org)
                .code(request.getCode().toUpperCase())
                .name(name)
                .description(request.getDescription())
                .systemDefined(false)
                .active(true)
                .build();
        role = roleRepository.save(role);
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        if (role.getSystemDefined() != null && role.getSystemDefined()) {
            throw new BadRequestException("System defined roles cannot be modified directly");
        }
        String name = request.getDisplayName() != null ? request.getDisplayName() : request.getName();
        if (name != null && !name.trim().isEmpty()) {
            role.setName(name);
        }
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }
        role = roleRepository.save(role);
        return mapToResponse(role);
    }

    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        if (role.getSystemDefined() != null && role.getSystemDefined()) {
            throw new BadRequestException("System defined roles cannot be deleted");
        }
        role.setActive(false);
        roleRepository.save(role);
    }

    private RoleResponse mapToResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .displayName(role.getName())
                .description(role.getDescription())
                .systemDefined(role.getSystemDefined())
                .active(role.getActive())
                .organizationId(role.getOrganization() != null ? role.getOrganization().getId() : null)
                .build();
    }
}
