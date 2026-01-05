from pydantic import Field
from models.dual_case_model import CamelModel as BaseModel


class GetCodeParams(BaseModel):
    sql_text: str = Field(..., min_length=1)
    file_root_model: str = Field(..., min_length=1)
    run_procs: bool = Field(default=True)
    run_py_models: bool = Field(default=True)
    run_py_controllers: bool = Field(default=True)
    run_cs_models: bool = Field(default=True)
    run_cs_controllers: bool = Field(default=True)
    run_ts_models: bool = Field(default=True)
    run_ts_services: bool = Field(default=True)
    run_ts_components: bool = Field(default=True)
    run_ts_routing: bool = Field(default=True)
    run_ts_options: bool = Field(default=True)
    one_off: bool = Field(default=True)
    rename_option_keys: dict = Field(default={})
    remove_from_label_strings: list[str] = Field(default=[])
    ignore_fields: list[str] = Field(default=[])
    ignore_fields_proc: list[str] = Field(default=[])
