from http.client import HTTPException
from fastapi import APIRouter, Request
from typing import Any, Dict
from models.code_writer_params import GetCodeParams
from shared.data_access import DataAccess
from meta_scripting.run_create_files import run_create_files, run_create_files_multi


router = APIRouter()

data_access = DataAccess()


def record_token_usage(user: str, account_id: int, requests_used: int):
    sql = "EXEC dbo.spTokenUsage_Record @EditUser=:email"
    sql += ", @AccountId=:account_id"
    sql += ", @RequestsUsed=:requests_used"

    sql_params = {
        "email": user,
        "account_id": account_id,
        "requests_used": requests_used,
    }

    data_access.execute_query_with_params(sql, sql_params)


def get_tokens_available(user: str, account_id: int):
    sql = "EXEC dbo.spTokensAvailable_Get @EditUser=:email"
    sql += ", @AccountId=:account_id"

    sql_params = {
        "email": user,
        "account_id": account_id,
    }

    return data_access.load_query_single_with_params(sql, sql_params)


@router.post("/GenerateCodeFiles", response_model=Dict[str, Any])
def generate_code_files(parameters: GetCodeParams, request: Request):
    email = request.state.user["email"]
    account_id = request.state.user["account_id"]

    tokens_available = get_tokens_available(email, account_id)

    if tokens_available["tokensAvailable"] > 0:
        result = run_create_files(
            parameters.sql_text,
            parameters.file_root_model,
            parameters.rename_option_keys,
            parameters.remove_from_label_strings,
            parameters.ignore_fields,
            parameters.ignore_fields_proc,
            parameters.run_procs,
            parameters.run_py_models,
            parameters.run_py_controllers,
            parameters.run_cs_models,
            parameters.run_cs_controllers,
            parameters.run_ts_models,
            parameters.run_ts_services,
            parameters.run_ts_components,
            parameters.run_ts_routing,
            parameters.run_ts_options,
            parameters.one_off,
        )

        record_token_usage(email, account_id, 1)

        return result
    elif tokens_available["tokensAvailable"] < tokens_available["userTokensAvailable"]:
        raise HTTPException(
            status_code=400,
            detail={"error": "Too few account tokens to complete request"},
        )
    else:
        raise HTTPException(
            status_code=400, detail={"error": "Too few user tokens to complete request"}
        )


@router.post("/GenerateCodeFilesMulti", response_model=Dict[str, Any])
def generate_code_files(parameters: GetCodeParams, request: Request):
    tables = parameters.sql_text.split("CREATE TABLE ")[1:]

    email = request.state.user["email"]
    account_id = request.state.user["account_id"]

    tokens_available = get_tokens_available(email, account_id)

    if tokens_available["tokensAvailable"] > tables:
        result = run_create_files_multi(
            tables,
            parameters.file_root_model,
            parameters.rename_option_keys,
            parameters.remove_from_label_strings,
            parameters.ignore_fields,
            parameters.ignore_fields_proc,
            parameters.run_procs,
            parameters.run_py_models,
            parameters.run_py_controllers,
            parameters.run_cs_models,
            parameters.run_cs_controllers,
            parameters.run_ts_models,
            parameters.run_ts_services,
            parameters.run_ts_components,
            parameters.run_ts_routing,
            parameters.run_ts_options,
            parameters.one_off,
        )

        record_token_usage(email, account_id, len(tables))

        return result
    elif tokens_available["tokensAvailable"] < tokens_available["userTokensAvailable"]:
        raise HTTPException(
            status_code=400,
            detail={"error": "Too few account tokens to complete request"},
        )
    else:
        raise HTTPException(
            status_code=400, detail={"error": "Too few user tokens to complete request"}
        )
