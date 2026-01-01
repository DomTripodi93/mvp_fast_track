from meta_scripting.helpers import (
    create_folder_if_not_exists,
    create_folders_if_not_exists,
    pascal_to_camel,
    pascal_to_kabob,
    pascal_to_snake,
)
from meta_scripting.to_angular_bulk_html import table_to_angular_bulk_html
from meta_scripting.to_angular_html import table_to_angular_html
from meta_scripting.to_mock import table_to_mock
from meta_scripting.to_procs import table_to_procs
from meta_scripting.to_pydantic import table_to_pydantic_model
from meta_scripting.to_fastapi_controller import table_to_fastapi_controller
from meta_scripting.to_angular_bulk_component import table_to_angular_bulk_component
from meta_scripting.to_angular_component import table_to_angular_component
from meta_scripting.to_angular_model import table_to_angular_model
from meta_scripting.to_cs_model import table_to_cs_model
from meta_scripting.to_dotnet_controller import table_to_dotnet_controller
from meta_scripting.to_angular_service import table_to_angular_service
from meta_scripting.to_angular_routing import table_to_angular_routing
from meta_scripting.to_angular_option_service import table_to_angular_option_service


option_service_header = f"""
import {"{"} Injectable {"}"} from "@angular/core";
import {"{"} ErrorService {"}"} from './error-service.service';
import {"{"} ErrorInfo {"}"} from '../models/error-info.model';

@Injectable({"{"} providedIn: 'root' {"}"})
export class OptionService {"{"}
    optionsAvailable: boolean = false;
    errorInfo: ErrorInfo = this.errorServ.resetErrorMessage();
    optionLists: Record<string, any[]> = {"{"}{"}"}
"""
component_option_imports = ""
component_option_keys = ""
component_option_constructor = ""
component_option_subscribe = ""
component_option_seed = ""
component_option_methods = ""


def prep_folder_and_file_names(
    file_root_model, table_name, one_off=False
) -> dict[str, str]:
    file_output_paths = {}
    folders_to_create = []

    fastapi_folder_root = "ml_backend"
    dotnet_folder_root = "backend"
    angular_folder_root = "frontend/src/app"
    if one_off:
        fastapi_folder_root = "one_off_code_outputs/ml_backend"
        dotnet_folder_root = "one_off_code_outputs/backend"
        angular_folder_root = "one_off_code_outputs/frontend"

    folders_to_create.append(fastapi_folder_root)
    folders_to_create.append(dotnet_folder_root)
    folders_to_create.append(angular_folder_root)
    folders_to_create.append("one_off_code_outputs/frontend/routing")
    folders_to_create.append("one_off_code_outputs/frontend/options")

    python_model_folder = f"{fastapi_folder_root}/models"
    folders_to_create.append(python_model_folder)

    python_model_section_folder = (
        f"{fastapi_folder_root}/models/{pascal_to_snake(file_root_model)}"
    )
    folders_to_create.append(python_model_section_folder)

    file_output_paths["python_model_output"] = (
        f"{python_model_section_folder}/{pascal_to_snake(table_name)}.py"
    )

    file_output_paths["routing"] = (
        f"one_off_code_outputs/frontend/routing/{pascal_to_snake(file_root_model)}-routing.js"
    )

    file_output_paths["routing-menu"] = (
        f"one_off_code_outputs/frontend/routing/{pascal_to_snake(file_root_model)}-routing-menu.js"
    )

    file_output_paths["dropdown"] = (
        f"one_off_code_outputs/frontend/routing/{pascal_to_snake(file_root_model)}-dropdowns-get.js"
    )

    python_controller_folder = f"{fastapi_folder_root}/controllers"
    folders_to_create.append(python_controller_folder)

    python_controller_section_folder = (
        f"{python_controller_folder}/{pascal_to_snake(file_root_model)}"
    )
    folders_to_create.append(python_controller_section_folder)

    file_output_paths["python_controller_output"] = (
        f"{python_controller_section_folder}/{pascal_to_snake(table_name)}_controller.py"
    )

    cs_model_folder = f"{dotnet_folder_root}/Models"
    folders_to_create.append(cs_model_folder)

    cs_model_section_folder = f"{cs_model_folder}/{file_root_model}"
    folders_to_create.append(cs_model_section_folder)

    file_output_paths["cs_model_output"] = f"{cs_model_section_folder}/{table_name}.cs"
    file_output_paths["cs_model_option_output"] = (
        f"{cs_model_section_folder}/{table_name}Option.cs"
    )

    cs_controller_folder = f"{dotnet_folder_root}/Controllers"
    folders_to_create.append(cs_controller_folder)

    cs_controller_section_folder = f"{cs_controller_folder}/{file_root_model}"
    folders_to_create.append(cs_controller_section_folder)

    file_output_paths["cs_controler_output"] = (
        f"{cs_controller_section_folder}/{table_name}Controller.cs"
    )

    ts_model_folder = f"{angular_folder_root}/models"
    folders_to_create.append(ts_model_folder)

    ts_model_section_folder = f"{ts_model_folder}/{pascal_to_kabob(file_root_model)}"
    folders_to_create.append(ts_model_section_folder)

    file_output_paths["ts_model_output"] = (
        f"{ts_model_section_folder}/{pascal_to_kabob(table_name)}.model.ts"
    )

    file_output_paths["ts_model_option_output"] = (
        f"{ts_model_section_folder}/{pascal_to_kabob(table_name)}-option.model.ts"
    )

    ts_service_folder = f"{angular_folder_root}/services"
    folders_to_create.append(ts_service_folder)

    ts_service_section_folder = (
        f"{ts_service_folder}/{pascal_to_kabob(file_root_model)}"
    )
    folders_to_create.append(ts_service_section_folder)

    file_output_paths["ts_service_output"] = (
        f"{ts_service_section_folder}/{pascal_to_kabob(table_name)}-service.service.ts"
    )

    file_output_paths["options"] = f"{ts_service_folder}/option-service.service.ts"

    ts_components_section_folder = (
        f"{angular_folder_root}/{pascal_to_kabob(file_root_model)}"
    )
    folders_to_create.append(ts_components_section_folder)

    ts_component_root_folder = f"{angular_folder_root}/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(table_name)}"
    folders_to_create.append(ts_component_root_folder)

    file_output_paths["ts_component_output"] = (
        f"{ts_component_root_folder}/{pascal_to_kabob(table_name)}-component.component.ts"
    )
    file_output_paths["ts_component_html_output"] = (
        f"{ts_component_root_folder}/{pascal_to_kabob(table_name)}-component.component.html"
    )
    file_output_paths["ts_component_css_output"] = (
        f"{ts_component_root_folder}/{pascal_to_kabob(table_name)}-component.component.css"
    )

    ts_component_single_root_folder = (
        f"{ts_component_root_folder}/{pascal_to_kabob(table_name)}-single"
    )
    folders_to_create.append(ts_component_single_root_folder)
    file_output_paths["ts_component_single_output"] = (
        f"{ts_component_single_root_folder}/{pascal_to_kabob(table_name)}-single-component.component.ts"
    )
    file_output_paths["ts_component_html_single_output"] = (
        f"{ts_component_single_root_folder}/{pascal_to_kabob(table_name)}-single-component.component.html"
    )
    file_output_paths["ts_component_css_single_output"] = (
        f"{ts_component_single_root_folder}/{pascal_to_kabob(table_name)}-single-component.component.css"
    )

    ts_component_bulk_folder = (
        f"{ts_component_root_folder}/{pascal_to_kabob(table_name)}-bulk-upload"
    )
    # ts_component_bulk_folder = f"{angular_folder_root}/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(table_name)}-bulk-upload"
    folders_to_create.append(ts_component_bulk_folder)

    file_output_paths["ts_component_bulk_output"] = (
        f"{ts_component_bulk_folder}/{pascal_to_kabob(table_name)}-bulk-upload-component.component.ts"
    )
    file_output_paths["ts_component_bulk_html_output"] = (
        f"{ts_component_bulk_folder}/{pascal_to_kabob(table_name)}-bulk-upload-component.component.html"
    )
    file_output_paths["ts_component_bulk_css_output"] = (
        f"{ts_component_bulk_folder}/{pascal_to_kabob(table_name)}-bulk-upload-component.component.css"
    )

    create_folders_if_not_exists(folders_to_create)

    return file_output_paths


def run_create_files(
    sql_file,
    rename_option_keys,
    remove_from_label_strings,
    ignore_fields,
    ignore_fields_proc,
    run_procs=True,
    run_py_models=True,
    run_py_controllers=True,
    run_cs_models=True,
    run_cs_controllers=True,
    run_ts_models=True,
    run_ts_services=True,
    run_ts_components=True,
    run_ts_routing=True,
    run_ts_options=True,
    one_off=False,
    last_file=False,
):

    file_root_model = sql_file.split("/")[-1].split("Tables")[0]

    sql_proc_output = f"sql/{file_root_model}Procs.sql"

    sql_mock_output = f"sql/{file_root_model}Mocks.sql"

    model_headers = """
from models.dual_case_model import CamelModel as BaseModel
from datetime import datetime, date
    """

    controller_header = """
from fastapi import APIRouter, Request
from typing import Any, Dict
from shared.data_access import DataAccess


router = APIRouter()

data_access = DataAccess()
    """

    print("Opening SQL File")

    with open(sql_file, "r", encoding="utf-8") as file:
        text = file.read()

    tables = text.split("CREATE TABLE dbo.")[1:]

    for index, table in enumerate(tables):

        table_parts = table.split("\n")
        table = "(18,".join(table.split("(18, "))
        table_name = table_parts[0]
        # print(sql_to_pydantic_model(table,table_name))
        # print(sql_to_upsert_model(table,table_name))

        print("Prepping File Names: " + table_name)
        file_output_paths = prep_folder_and_file_names(
            file_root_model, table_name, one_off
        )

        file_open_type = "w"

        model_import = f"from models.{file_output_paths["python_model_output"].split("/")[-1].split(".")[0]} import {table_name}\n"

        print("Generating Code Files: " + table_name)

        if run_procs:
            with open(
                sql_mock_output, file_open_type if index == 0 else "a", encoding="utf-8"
            ) as file:
                file.write(table_to_mock(table, ignore_fields_proc, table_name))

            with open(
                sql_proc_output, file_open_type if index == 0 else "a", encoding="utf-8"
            ) as file:
                file.write(table_to_procs(table, ignore_fields_proc, table_name))

        if run_py_models:
            with open(
                file_output_paths["python_model_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file_output = model_headers + table_to_pydantic_model(
                    table, ignore_fields, table_name
                )

                file.write(file_output)

        if run_py_controllers:
            existing_controller = ""

            with open(
                file_output_paths["python_controller_output"], "w", encoding="utf-8"
            ) as file:
                updated_file = (
                    model_import
                    + existing_controller
                    + controller_header
                    + table_to_fastapi_controller(
                        table, ignore_fields_proc, table_name, file_root_model
                    )
                )

                file.write(updated_file)

        if run_cs_models:
            cs_models = table_to_cs_model(table, ignore_fields_proc, table_name)
            with open(
                file_output_paths["cs_model_output"], file_open_type, encoding="utf-8"
            ) as file:
                file.write(cs_models[0])

            with open(
                file_output_paths["cs_model_option_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(cs_models[1])

        print(run_cs_controllers)
        print(file_output_paths["cs_controler_output"])

        if run_cs_controllers:
            print("Generating C# Controller for: " + table_name)
            with open(
                file_output_paths["cs_controler_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(
                    table_to_dotnet_controller(table, ignore_fields_proc, table_name)
                )

        if run_ts_models:
            ts_models = table_to_angular_model(table, ignore_fields, table_name)
            with open(
                file_output_paths["ts_model_output"], file_open_type, encoding="utf-8"
            ) as file:
                file.write(ts_models[0])

            with open(
                file_output_paths["ts_model_option_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(ts_models[1])

        if run_ts_services:
            with open(
                file_output_paths["ts_service_output"], file_open_type, encoding="utf-8"
            ) as file:
                file.write(
                    table_to_angular_service(
                        table,
                        ignore_fields_proc,
                        rename_option_keys,
                        remove_from_label_strings,
                        table_name,
                        file_root_model,
                    )
                )

        if run_ts_components:
            components = table_to_angular_component(
                table,
                ignore_fields_proc,
                rename_option_keys,
                remove_from_label_strings,
                table_name,
                file_root_model,
            )
            with open(
                file_output_paths["ts_component_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(components[0])

            with open(
                file_output_paths["ts_component_single_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(components[1])

            html = table_to_angular_html(
                table,
                ignore_fields_proc,
                rename_option_keys,
                remove_from_label_strings,
                table_name,
            )
            with open(
                file_output_paths["ts_component_html_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(html[0])

            with open(
                file_output_paths["ts_component_html_single_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(html[1])

            with open(
                file_output_paths["ts_component_css_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write("")

            with open(
                file_output_paths["ts_component_bulk_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(
                    table_to_angular_bulk_component(
                        table, ignore_fields_proc, table_name, file_root_model
                    )
                )

            with open(
                file_output_paths["ts_component_bulk_html_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write(
                    table_to_angular_bulk_html(table, ignore_fields_proc, table_name)
                )

            with open(
                file_output_paths["ts_component_bulk_css_output"],
                file_open_type,
                encoding="utf-8",
            ) as file:
                file.write("")

        if run_ts_routing:
            routing_parts = table_to_angular_routing(table_name, file_root_model, index)
            latest_routing = ""
            if index > 0:
                with open(
                    file_output_paths["routing"], "r", encoding="utf-8"
                ) as file_read:
                    latest_routing = file_read.read()
            with open(file_output_paths["routing"], "w", encoding="utf-8") as file:
                file.write(routing_parts[0] + latest_routing + routing_parts[1])

            with open(
                file_output_paths["routing-menu"],
                file_open_type if index == 0 else "a",
                encoding="utf-8",
            ) as file:
                file.write(routing_parts[2])

        if run_ts_options:
            option_service_parts = table_to_angular_option_service(
                table, ignore_fields, table_name, file_root_model
            )
            global component_option_imports
            global component_option_keys
            global component_option_constructor
            global component_option_subscribe
            global component_option_seed
            global component_option_methods

            component_option_imports += option_service_parts[0]
            component_option_keys += option_service_parts[1]
            component_option_constructor += option_service_parts[2]
            component_option_subscribe += option_service_parts[3]
            component_option_seed += option_service_parts[4]
            component_option_methods += option_service_parts[5]

            if len(tables) == index + 1 and last_file:
                option_service = f"""{component_option_imports}
{option_service_header}
{component_option_keys}

    constructor({component_option_constructor}
        private errorServ: ErrorService,
    ){"{"}{"}"}

    seedAllOptions() {"{"}
        Promise.all([{component_option_seed}
        ]).then(()=>{"{"}
            this.optionsAvailable = true;
        {"}"})
    {"}"}

    subscribeOptionsHaveChanged() {"{"}{component_option_subscribe}
    {"}"}

    {component_option_methods}

{"}"}
"""
                with open(file_output_paths["options"], "w", encoding="utf-8") as file:
                    file.write(option_service)


def run_create_all_files(
    sql_file_location,
    sql_files,
    rename_option_keys,
    remove_from_label_strings,
    ignore_fields,
    ignore_fields_proc,
    run_procs=True,
    run_py_models=True,
    run_py_controllers=True,
    run_cs_models=True,
    run_cs_controllers=True,
    run_ts_models=True,
    run_ts_services=True,
    run_ts_components=True,
    run_ts_routing=True,
    run_ts_options=True,
    one_off=False,
):
    last_file = False
    for index, file_name in enumerate(sql_files):
        if len(sql_files) == index + 1:
            last_file = True

        sql_file = sql_file_location + file_name

        run_create_files(
            sql_file,
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
            last_file,
        )
