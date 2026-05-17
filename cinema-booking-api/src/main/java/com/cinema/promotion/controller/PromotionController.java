package com.cinema.promotion.controller;

import com.cinema.common.ApiResponse;
import com.cinema.common.exception.BusinessException;
import com.cinema.common.exception.ErrorCode;
import com.cinema.common.exception.ResourceNotFoundException;
import com.cinema.promotion.entity.PromotionEntity;
import com.cinema.promotion.repository.PromotionDao;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Promotions", description = "Promotions management")
public class PromotionController {

    private final PromotionDao promotionDao;

    @GetMapping("/api/v1/promotions/check/{code}")
    @Operation(summary = "Check promotion code (public)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPromotion(@PathVariable String code) {
        PromotionEntity promo = promotionDao.findByCodeAndStatus(code.toUpperCase(), "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        Map<String, Object> result = Map.of(
                "code", promo.getCode(),
                "description", promo.getDescription() != null ? promo.getDescription() : "",
                "discountType", promo.getDiscountType(),
                "discountValue", promo.getDiscountValue(),
                "minOrderValue", promo.getMinOrderValue(),
                "maxDiscountAmount", promo.getMaxDiscountAmount() != null ? promo.getMaxDiscountAmount() : 0,
                "valid", true
        );

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/api/v1/admin/promotions")
    @Operation(summary = "List promotions (Admin)")
    public ResponseEntity<ApiResponse<List<PromotionEntity>>> getAllPromotions() {
        return ResponseEntity.ok(ApiResponse.ok(promotionDao.findAll()));
    }

    @PostMapping("/api/v1/admin/promotions")
    @Operation(summary = "Create promotion (Admin)")
    public ResponseEntity<ApiResponse<PromotionEntity>> createPromotion(@RequestBody PromotionEntity promotion) {
        if (promotionDao.existsByCode(promotion.getCode())) {
            throw new BusinessException(ErrorCode.PROMOTION_CODE_EXISTS);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(promotionDao.save(promotion)));
    }

    @PutMapping("/api/v1/admin/promotions/{id}")
    @Operation(summary = "Update promotion (Admin)")
    public ResponseEntity<ApiResponse<PromotionEntity>> updatePromotion(
            @PathVariable Long id,
            @RequestBody PromotionEntity update) {
        PromotionEntity promo = promotionDao.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PROMOTION_NOT_FOUND));

        if (update.getDescription() != null) promo.setDescription(update.getDescription());
        if (update.getDiscountType() != null) promo.setDiscountType(update.getDiscountType());
        if (update.getDiscountValue() != null) promo.setDiscountValue(update.getDiscountValue());
        if (update.getMinOrderValue() != null) promo.setMinOrderValue(update.getMinOrderValue());
        if (update.getMaxDiscountAmount() != null) promo.setMaxDiscountAmount(update.getMaxDiscountAmount());
        if (update.getStartTime() != null) promo.setStartTime(update.getStartTime());
        if (update.getEndTime() != null) promo.setEndTime(update.getEndTime());
        if (update.getUsageLimit() != null) promo.setUsageLimit(update.getUsageLimit());
        if (update.getStatus() != null) promo.setStatus(update.getStatus());
        // Allow setting to null (applies to all movies) or a specific list
        promo.setApplicableMovieIds(update.getApplicableMovieIds());

        return ResponseEntity.ok(ApiResponse.ok(promotionDao.save(promo), "C\u1eadp nh\u1eadt khuy\u1ebfn m\u00e3i th\u00e0nh c\u00f4ng"));
    }

    @DeleteMapping("/api/v1/admin/promotions/{id}")
    @Operation(summary = "Delete promotion (Admin)")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        if (!promotionDao.existsById(id)) {
            throw new ResourceNotFoundException(ErrorCode.PROMOTION_NOT_FOUND);
        }
        promotionDao.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "\u0110\u00e3 x\u00f3a m\u00e3 khuy\u1ebfn m\u00e3i"));
    }
}
