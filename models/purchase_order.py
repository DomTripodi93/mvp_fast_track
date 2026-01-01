from models.dual_case_model import CamelModel as BaseModel
from datetime import datetime, date


class PurchaseOrder(BaseModel):
    purchase_order_id: int = None
    purchase_order_number: str
    vendor_code: str
    vendor_location_id: int
    vendor_contact_id: int
    order_date: date
    expected_delivery_date: date = None
    po_status: str
    currency: str
    purchase_order_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class PurchaseOrderLine(BaseModel):
    purchase_order_line_id: int = None
    purchase_order_id: int
    line_number: str
    item_code: str
    unit_of_measure: str
    unit_price: float
    order_quantity: int
    expected_delivery_date: date = None
    purchase_order_line_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class PurchaseOrderReceipt(BaseModel):
    purchase_order_receipt_id: int = None
    purchase_order_id: int
    purchase_order_line_id: int
    received_date: datetime
    quantity_received: int
    purchase_order_receipt_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class PurchaseOrderRejection(BaseModel):
    purchase_order_rejection_id: int = None
    purchase_order_id: int
    purchase_order_line_id: int
    rejected_date: datetime
    quantity_rejected: int
    rejection_reason: str = None
    purchase_order_rejection_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class RequestForQuote(BaseModel):
    request_for_quote_id: int = None
    request_for_quote_number: str
    vendor_code: str
    vendor_location_id: int
    vendor_contact_id: int
    request_for_quote_date: date
    request_for_quote_status: str
    currency: str
    request_for_quote_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class RequestForQuoteLine(BaseModel):
    request_for_quote_line_id: int = None
    request_for_quote_id: int
    line_number: str
    item_code: str
    unit_of_measure: str
    order_quantity: int
    quote_price: float
    lead_time: int = None
    lead_time_unit_of_measure: str = None
    request_for_quote_line_notes: str = None
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str
