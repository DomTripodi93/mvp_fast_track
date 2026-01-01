from pydantic import Field
from models.dual_case_model import CamelModel as BaseModel


class StoredProcedureParamsExample(BaseModel):
    param1: str = Field(..., min_length=1, max_length=256)
    param2: int = Field(..., ge=0, le=100)


class GetInvoicesParams(BaseModel):
    JobNumber: str = Field(..., min_length=1, max_length=256)
    JobNumber: str = Field(..., min_length=1, max_length=50)
    JobNumber: str = Field(..., min_length=1, max_length=50)
    param2: int = Field(..., ge=0, le=100)
