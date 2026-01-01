
from models.dual_case_model import CamelModel as BaseModel
from datetime import datetime


class Vendor(BaseModel):
    vendor_code: str = None
    vendor_name: str = None
    terms: str = None
    tax_id: str = None
    is_active: bool
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class VendorLocation(BaseModel):
    vendor_location_id: int = None
    vendor_code: str
    location_name: str = None
    address_line1: str = None
    address_line2: str = None
    address_line3: str = None
    zip_code: str = None
    country: str = None
    terms: str = None
    is_primary_location: bool
    is_active: bool
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str


class VendorContact(BaseModel):
    vendor_contact_id: int = None
    vendor_code: str
    primary_location_id: str
    contact_name: str = None
    email: str = None
    phone: str = None
    is_active: bool
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str