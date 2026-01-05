from models.purchase_order import RequestForQuoteLine
from models.purchase_order import RequestForQuote
from models.purchase_order import PurchaseOrderRejection
from models.purchase_order import PurchaseOrderReceipt
from models.purchase_order import PurchaseOrderLine
from models.purchase_order import PurchaseOrder

from fastapi import APIRouter, Request
from typing import Any, Dict
from shared.data_access import DataAccess


router = APIRouter()

data_access = DataAccess()

@router.post("/GetPurchaseOrders")
def get_purchase_order(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spPurchaseOrder_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeletePurchaseOrder/{purchase_order_id}")
def delete_purchase_order(purchase_order_id: str, request: Request):
    sql = "EXEC dbo.spPurchaseOrder_Delete @EditUser=:email"
    sql += ", @PurchaseOrderId=:purchase_order_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_id": purchase_order_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertPurchaseOrder")
def upsert_purchase_order(purchase_order: PurchaseOrder, request: Request):
    sql = "EXEC dbo.spPurchaseOrder_Upsert @EditUser=:email"
    sql += ", @PurchaseOrderId=:purchase_order_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_id": purchase_order.purchase_order_id,
		"purchase_order_number": purchase_order.purchase_order_number,
		"vendor_code": purchase_order.vendor_code,
		"vendor_location_id": purchase_order.vendor_location_id,
		"vendor_contact_id": purchase_order.vendor_contact_id,
		"order_date": purchase_order.order_date,
		"expected_delivery_date": purchase_order.expected_delivery_date,
		"po_status": purchase_order.po_status,
		"currency": purchase_order.currency,
		"purchase_order_notes": purchase_order.purchase_order_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    

@router.post("/GetPurchaseOrderLines")
def get_purchase_order_line(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spPurchaseOrderLine_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeletePurchaseOrderLine/{purchase_order_line_id}")
def delete_purchase_order_line(purchase_order_line_id: str, request: Request):
    sql = "EXEC dbo.spPurchaseOrderLine_Delete @EditUser=:email"
    sql += ", @PurchaseOrderLineId=:purchase_order_line_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_line_id": purchase_order_line_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertPurchaseOrderLine")
def upsert_purchase_order_line(purchase_order_line: PurchaseOrderLine, request: Request):
    sql = "EXEC dbo.spPurchaseOrderLine_Upsert @EditUser=:email"
    sql += ", @PurchaseOrderLineId=:purchase_order_line_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_line_id": purchase_order_line.purchase_order_line_id,
		"purchase_order_id": purchase_order_line.purchase_order_id,
		"line_number": purchase_order_line.line_number,
		"item_code": purchase_order_line.item_code,
		"unit_of_measure": purchase_order_line.unit_of_measure,
		"unit_price": purchase_order_line.unit_price,
		"order_quantity": purchase_order_line.order_quantity,
		"expected_delivery_date": purchase_order_line.expected_delivery_date,
		"purchase_order_line_notes": purchase_order_line.purchase_order_line_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    

@router.post("/GetPurchaseOrderReceipts")
def get_purchase_order_receipt(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spPurchaseOrderReceipt_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeletePurchaseOrderReceipt/{purchase_order_receipt_id}")
def delete_purchase_order_receipt(purchase_order_receipt_id: str, request: Request):
    sql = "EXEC dbo.spPurchaseOrderReceipt_Delete @EditUser=:email"
    sql += ", @PurchaseOrderReceiptId=:purchase_order_receipt_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_receipt_id": purchase_order_receipt_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertPurchaseOrderReceipt")
def upsert_purchase_order_receipt(purchase_order_receipt: PurchaseOrderReceipt, request: Request):
    sql = "EXEC dbo.spPurchaseOrderReceipt_Upsert @EditUser=:email"
    sql += ", @PurchaseOrderReceiptId=:purchase_order_receipt_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_receipt_id": purchase_order_receipt.purchase_order_receipt_id,
		"purchase_order_id": purchase_order_receipt.purchase_order_id,
		"purchase_order_line_id": purchase_order_receipt.purchase_order_line_id,
		"received_date": purchase_order_receipt.received_date,
		"quantity_received": purchase_order_receipt.quantity_received,
		"purchase_order_receipt_notes": purchase_order_receipt.purchase_order_receipt_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    

@router.post("/GetPurchaseOrderRejections")
def get_purchase_order_rejection(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spPurchaseOrderRejection_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeletePurchaseOrderRejection/{purchase_order_rejection_id}")
def delete_purchase_order_rejection(purchase_order_rejection_id: str, request: Request):
    sql = "EXEC dbo.spPurchaseOrderRejection_Delete @EditUser=:email"
    sql += ", @PurchaseOrderRejectionId=:purchase_order_rejection_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_rejection_id": purchase_order_rejection_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertPurchaseOrderRejection")
def upsert_purchase_order_rejection(purchase_order_rejection: PurchaseOrderRejection, request: Request):
    sql = "EXEC dbo.spPurchaseOrderRejection_Upsert @EditUser=:email"
    sql += ", @PurchaseOrderRejectionId=:purchase_order_rejection_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "purchase_order_rejection_id": purchase_order_rejection.purchase_order_rejection_id,
		"purchase_order_id": purchase_order_rejection.purchase_order_id,
		"purchase_order_line_id": purchase_order_rejection.purchase_order_line_id,
		"rejected_date": purchase_order_rejection.rejected_date,
		"quantity_rejected": purchase_order_rejection.quantity_rejected,
		"rejection_reason": purchase_order_rejection.rejection_reason,
		"purchase_order_rejection_notes": purchase_order_rejection.purchase_order_rejection_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    

@router.post("/GetRequestForQuotes")
def get_request_for_quote(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spRequestForQuote_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeleteRequestForQuote/{request_for_quote_id}")
def delete_request_for_quote(request_for_quote_id: str, request: Request):
    sql = "EXEC dbo.spRequestForQuote_Delete @EditUser=:email"
    sql += ", @RequestForQuoteId=:request_for_quote_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "request_for_quote_id": request_for_quote_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertRequestForQuote")
def upsert_request_for_quote(request_for_quote: RequestForQuote, request: Request):
    sql = "EXEC dbo.spRequestForQuote_Upsert @EditUser=:email"
    sql += ", @RequestForQuoteId=:request_for_quote_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "request_for_quote_id": request_for_quote.request_for_quote_id,
		"request_for_quote_number": request_for_quote.request_for_quote_number,
		"vendor_code": request_for_quote.vendor_code,
		"vendor_location_id": request_for_quote.vendor_location_id,
		"vendor_contact_id": request_for_quote.vendor_contact_id,
		"request_for_quote_date": request_for_quote.request_for_quote_date,
		"request_for_quote_status": request_for_quote.request_for_quote_status,
		"currency": request_for_quote.currency,
		"request_for_quote_notes": request_for_quote.request_for_quote_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    

@router.post("/GetRequestForQuoteLines")
def get_request_for_quote_line(parameters: Dict[str, Any], request: Request):
    sql = "EXEC dbo.spRequestForQuoteLine_Get @EditUser=:email"
    
    sql_params = {
        "email": request.state.user["email"]
    }
    
    return data_access.load_query_with_params(sql, sql_params)
    
@router.post("/DeleteRequestForQuoteLine/{request_for_quote_line_id}")
def delete_request_for_quote_line(request_for_quote_line_id: str, request: Request):
    sql = "EXEC dbo.spRequestForQuoteLine_Delete @EditUser=:email"
    sql += ", @RequestForQuoteLineId=:request_for_quote_line_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "request_for_quote_line_id": request_for_quote_line_id
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
@router.post("/UpsertRequestForQuoteLine")
def upsert_request_for_quote_line(request_for_quote_line: RequestForQuoteLine, request: Request):
    sql = "EXEC dbo.spRequestForQuoteLine_Upsert @EditUser=:email"
    sql += ", @RequestForQuoteLineId=:request_for_quote_line_id"
    
    sql_params = {
        "email": request.state.user["email"],
        "request_for_quote_line_id": request_for_quote_line.request_for_quote_line_id,
		"request_for_quote_id": request_for_quote_line.request_for_quote_id,
		"line_number": request_for_quote_line.line_number,
		"item_code": request_for_quote_line.item_code,
		"unit_of_measure": request_for_quote_line.unit_of_measure,
		"order_quantity": request_for_quote_line.order_quantity,
		"quote_price": request_for_quote_line.quote_price,
		"lead_time": request_for_quote_line.lead_time,
		"lead_time_unit_of_measure": request_for_quote_line.lead_time_unit_of_measure,
		"request_for_quote_line_notes": request_for_quote_line.request_for_quote_line_notes
    }
    
    return data_access.execute_query_with_params(sql, sql_params)
    
    
