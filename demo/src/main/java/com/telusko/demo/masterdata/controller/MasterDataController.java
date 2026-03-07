package com.telusko.demo.masterdata.controller;

import com.telusko.demo.common.dto.ApiResponse;
import com.telusko.demo.masterdata.entity.MasterType;
import com.telusko.demo.masterdata.entity.MasterValue;
import com.telusko.demo.masterdata.service.MasterDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for master data management.
 * Master data drives all configurable dropdowns in the application.
 */
@RestController
@RequestMapping("/api/master-data")
public class MasterDataController {

    private static final Logger log = LoggerFactory.getLogger(MasterDataController.class);

    private final MasterDataService masterDataService;

    public MasterDataController(MasterDataService masterDataService) {
        this.masterDataService = masterDataService;
    }

    @GetMapping("/types")
    public ResponseEntity<ApiResponse<List<MasterType>>> getTypes(@RequestParam Long orgId) {
        log.info("GET /api/master-data/types?orgId={}", orgId);
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getTypesByOrg(orgId)));
    }

    @PostMapping("/types")
    public ResponseEntity<ApiResponse<MasterType>> createType(@RequestBody Map<String, String> body,
            @RequestParam Long orgId) {
        log.info("POST /api/master-data/types - code: {}", body.get("code"));
        MasterType type = masterDataService.createType(orgId, body.get("code"), body.get("name"),
                body.get("description"));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Type created", type));
    }

    @GetMapping("/values")
    public ResponseEntity<ApiResponse<List<MasterValue>>> getValues(@RequestParam Long typeId) {
        log.info("GET /api/master-data/values?typeId={}", typeId);
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getValuesByType(typeId)));
    }

    @GetMapping("/values/by-code")
    public ResponseEntity<ApiResponse<List<MasterValue>>> getValuesByCode(@RequestParam String typeCode) {
        log.info("GET /api/master-data/values/by-code?typeCode={}", typeCode);
        return ResponseEntity.ok(ApiResponse.success(masterDataService.getValuesByTypeCode(typeCode)));
    }

    @PostMapping("/values")
    public ResponseEntity<ApiResponse<MasterValue>> createValue(@RequestBody Map<String, Object> body) {
        log.info("POST /api/master-data/values - code: {}", body.get("code"));

        // Resolve typeId — accept either typeId (number) or typeCode (string)
        Long typeId = null;
        if (body.get("typeId") != null) {
            typeId = Long.valueOf(body.get("typeId").toString());
        } else if (body.get("typeCode") != null) {
            String typeCode = body.get("typeCode").toString();
            MasterType type = masterDataService.getTypeByCode(typeCode);
            if (type != null) {
                typeId = type.getId();
            } else {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("MasterType not found for code: " + typeCode));
            }
        } else {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Either typeId or typeCode is required"));
        }

        MasterValue value = masterDataService.createValue(
                typeId,
                (String) body.get("code"),
                (String) body.get("displayName"),
                (String) body.get("description"),
                body.get("sortOrder") != null ? Integer.valueOf(body.get("sortOrder").toString()) : null,
                body.get("isDefault") != null ? Boolean.valueOf(body.get("isDefault").toString()) : false);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Value created", value));
    }

    @PostMapping("/seed/{orgId}")
    public ResponseEntity<ApiResponse<Void>> seedDefaults(@PathVariable Long orgId) {
        log.info("POST /api/master-data/seed/{}", orgId);
        masterDataService.seedDefaultData(orgId);
        return ResponseEntity.ok(ApiResponse.success("Default master data seeded successfully", null));
    }
}
