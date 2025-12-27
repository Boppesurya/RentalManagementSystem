package com.xerox.rental.mapper;

import com.xerox.rental.dto.CompanySettingsRequest;
import com.xerox.rental.dto.CompanySettingsResponse;
import com.xerox.rental.entity.CompanySettings;

public class CompanySettingsMapper {

    public static CompanySettingsResponse toResponse(CompanySettings cs) {
        CompanySettingsResponse res = new CompanySettingsResponse();
        res.setId(cs.getId());
        res.setOwnerId(cs.getOwner().getId());

        res.setCompanyName(cs.getCompanyName());
        res.setCompanyLogoUrl(cs.getCompanyLogoUrl());
        res.setStampImageUrl(cs.getStampImageUrl());
        res.setSignatureImageUrl(cs.getSignatureImageUrl());

        res.setDefaultCopyRatio(cs.getDefaultCopyRatio());
        res.setDefaultFreeCopies(cs.getDefaultFreeCopies());

        res.setAddress(cs.getAddress());
        res.setPhone(cs.getPhone());
        res.setEmail(cs.getEmail());
        res.setGstNumber(cs.getGstNumber());

        res.setCreatedAt(cs.getCreatedAt() != null ? cs.getCreatedAt().toString() : null);
        res.setUpdatedAt(cs.getUpdatedAt() != null ? cs.getUpdatedAt().toString() : null);

        return res;
    }

    public static void updateEntity(CompanySettings cs, CompanySettingsRequest req) {
        cs.setCompanyName(req.getCompanyName());
        cs.setCompanyLogoUrl(req.getCompanyLogoUrl());
        cs.setStampImageUrl(req.getStampImageUrl());
        cs.setSignatureImageUrl(req.getSignatureImageUrl());

        cs.setDefaultCopyRatio(req.getDefaultCopyRatio());
        cs.setDefaultFreeCopies(req.getDefaultFreeCopies());

        cs.setAddress(req.getAddress());
        cs.setPhone(req.getPhone());
        cs.setEmail(req.getEmail());
        cs.setGstNumber(req.getGstNumber());
    }
}
