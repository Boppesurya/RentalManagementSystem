package com.xerox.rental.dto;

import com.xerox.rental.entity.InvoiceItem;

import lombok.Data;

@Data
public class InvoiceItemResponse {
	 private Long id;
	    private Long machineId;
	    private String machineName;
	    private String machineModel;
	    private Long startingReading;
	    private Long closingReading;
	    private Long totalCopies;
	    private Long freeCopies;
	    private Long billableCopies;
	    private Double copyRatio;
	    private Double monthlyRent;
	    private Double amount;

	    public static InvoiceItemResponse fromEntity(InvoiceItem item) {
	        InvoiceItemResponse response = new InvoiceItemResponse();
	        response.setId(item.getId());
	        response.setMachineId(item.getMachine().getId());
	        response.setMachineName(item.getMachine().getName());
	        response.setMachineModel(item.getMachine().getModel());
	        response.setStartingReading(item.getStartingReading());
	        response.setClosingReading(item.getClosingReading());
	        response.setTotalCopies(item.getTotalCopies());
	        response.setFreeCopies(item.getFreeCopies());
	        response.setBillableCopies(item.getBillableCopies());
	        response.setCopyRatio(item.getCopyRatio());
	        response.setMonthlyRent(item.getMonthlyRent());
	        response.setAmount(item.getAmount());
	        return response;
	    }

}
