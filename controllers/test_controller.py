from typing import Any, Dict
from fastapi import APIRouter, Request
from shared.data_access import DataAccess



router = APIRouter()

data_access = DataAccess()


@router.get("")
def test_running():
    return {"result": "API Is Running!"}


@router.get("/testConnection")
def test_connection():
    sql = "SELECT GETDATE() AS Result;"
    # sql = "EXEC TutorialAppSchema.spUsers_Get;"
    return data_access.load_query(sql)


@router.post("/testPost")
def test_connection(req_body: Dict[str, Any], request: Request):
    print(req_body)
    print(request)
    print(request.state)
    print(request.state.user)
    print(request.state.user["email"])
    sql = "SELECT GETDATE() AS Result;"
    # sql = "EXEC TutorialAppSchema.spUsers_Get;"
    return data_access.load_query(sql)

@router.get("/testBulkId")
def test_bulk_id():
    print("started")
    sql_get_bulk_id = "EXEC dbo.spPurchaseOrderBulkUploadId_Get"
    result = data_access.execute_query_with_results(sql_get_bulk_id)
    
    bulk_upload_id = result[0][0]["bulkUploadId"]
    
    # bulk_upload_id2 = data_access.execute_query_with_results(sql_get_bulk_id)[0]["bulkUploadId"]
    # print(bulk_upload_id2)
    
    return result
    
