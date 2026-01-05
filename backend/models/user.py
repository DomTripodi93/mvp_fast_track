
from models.dual_case_model import CamelModel as BaseModel
from datetime import datetime

class UserInfo(BaseModel):
    email: str
    first_name: str = None
    last_name: str = None
    is_active: bool
    is_admin: bool
    owns_accounts_payable: bool
    owns_subcontracts: bool
    owns_purchase_orders: bool
    owns_accounts_receivable: bool
    owns_customer_relationships: bool
    owns_accounts_job_management: bool
    owns_equipment: bool
    owns_inventory: bool
    owns_payroll: bool
    owns_finances: bool
    owns_secure_documents: bool
    owns_user_management: bool
    can_view_accounts_payable: bool
    can_view_subcontracts: bool
    can_view_purchase_orders: bool
    can_view_accounts_receivable: bool
    can_view_customer_relationships: bool
    can_view_accounts_job_management: bool
    can_view_equipment: bool
    can_view_inventory: bool
    can_view_payroll: bool
    can_view_finances: bool
    can_view_secure_documents: bool
    can_view_user_management: bool
    can_edit_accounts_payable: bool
    can_edit_subcontracts: bool
    can_edit_purchase_orders: bool
    can_edit_accounts_receivable: bool
    can_edit_customer_relationships: bool
    can_edit_accounts_job_management: bool
    can_edit_equipment: bool
    can_edit_inventory: bool
    can_edit_payroll: bool
    can_edit_finances: bool
    can_edit_secure_documents: bool
    can_edit_user_management: bool
    insert_date: datetime
    insert_user: str
    update_date: datetime
    update_user: str