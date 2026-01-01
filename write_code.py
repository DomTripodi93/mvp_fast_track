import re

from meta_scripting.run_create_files import run_create_all_files

run_procs = True

run_py_models = False
run_py_controllers = False

run_cs_models = True
run_cs_controllers = True

run_ts_models = True
run_ts_services = True
run_ts_components = True
run_ts_routing = False
run_ts_options = False

one_off = False

sql_file_location = "sql/"
sql_files = [
    # "ProcModelTables.sql",
    "MOMTables.sql",
    "FeedbackTables.sql",
]
rename_option_keys = {
    "BillToCustomer": "customerId",
    "ShipToCustomer": "customerId",
    "PreferredVendor": "vendorId",
    "BillToCustomerId": "customerId",
    "ShipToCustomerId": "customerId",
    "PreferredVendorId": "vendorId",
}
remove_from_label_strings = [
    "Number",
    "Num",
    "Op",
    "Name",
    "Id",
]

ignore_fields = ["DEFAULT", "DROP", "GO"]

ignore_fields_proc = [
    "DEFAULT",
    "DROP",
    "GO",
    "UpdateDate",
    "UpdateUser",
    "InsertDate",
    "InsertUser",
]

run_create_all_files(
    sql_file_location,
    sql_files,
    rename_option_keys,
    remove_from_label_strings,
    ignore_fields,
    ignore_fields_proc,
    run_procs,
    run_py_models,
    run_py_controllers,
    run_cs_models,
    run_cs_controllers,
    run_ts_models,
    run_ts_services,
    run_ts_components,
    run_ts_routing,
    run_ts_options,
    one_off,
)

# for file_name in sql_files:
#     sql_file = sql_file_location + file_name

#     run_create_files(
#         sql_file,
#         run_procs,
#         run_py_models,
#         run_py_controllers,
#         run_cs_models,
#         run_cs_controllers,
#         run_ts_models,
#         run_ts_services,
#         run_ts_components,
#         run_ts_routing,
#         run_ts_options,
#         one_off,
#     )
