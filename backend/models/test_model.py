
from models.dual_case_model import CamelModel as BaseModel

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None
