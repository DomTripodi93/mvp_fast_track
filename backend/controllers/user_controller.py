from fastapi import APIRouter
from shared.data_access import DataAccess
# from app.schemas.item_schema import Item

# Create APIRouter instance
router = APIRouter()

data_access = DataAccess()

# Define item endpoints
@router.get("")
def test_running():
    return {"result": "API Is Running!"}

# Define item endpoints
@router.get("/testConnection")
def test_connection():
    sql = "SELECT GETDATE();"
    return data_access.loadQuery(sql)
