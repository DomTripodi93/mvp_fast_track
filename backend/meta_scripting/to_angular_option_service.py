import re
from meta_scripting.helpers import (
    pascal_to_words,
    pascal_to_camel,
    pascal_to_kabob,
)


def table_to_angular_option_service(
    sql: str,
    ignore_fields: list[str],
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
) -> str:
    columns = re.findall(r"\s*(\w+)\s+([\w()]+)(.*)", sql, re.IGNORECASE)
    option_model_field_names = []
    for col_name, col_type, extras in columns:

        if (
            not col_name in ignore_fields
            and (col_name != model_name or col_type != "(")
            and not (
                "clustered" in extras.lower()
                and col_name.lower() == "primary"
                and col_type.lower() == "key"
            )
            and not col_name.lower() == "link"
        ):
            is_primary = "primary key" in extras.lower()
            if is_primary:
                option_model_field_names.append(f'"{pascal_to_camel(col_name)}"')
        elif (
            "clustered" in extras.lower()
            and col_name.lower() == "primary"
            and col_type.lower() == "key"
        ):
            primary_key_fields = extras[(extras.index("(") + 1) : extras.index(")")]
            primary_keys_string = primary_key_fields.replace(" ", "")
            primary_keys = primary_keys_string.split(",")
            for primary_key in primary_keys:
                option_model_field_names.append(f'"{pascal_to_camel(primary_key)}"')

    model_name_words = pascal_to_words(model_name)

    component_option_imports = f"""import {"{"} {model_name}Option {"}"} from "../models/{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-option.model";
import {"{"} {model_name}Service {"}"} from './{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}-service.service';
"""

    # {pascal_to_camel(model_name)}Options: {model_name}Option[] = [];
    component_option_keys = f"""
    {pascal_to_camel(model_name)}Keys: string[] = [
        {",\n\t\t".join(option_model_field_names)}
    ];
"""

    component_option_constructor = f"""
        public {pascal_to_camel(model_name)}Serv: {model_name}Service,"""

    component_option_subscribe = f"""
        this.subscribe{model_name}OptionsHaveChanged();"""

    component_option_seed = f"""
            this.set{model_name}Options(),"""

    component_option_methods = f"""
    
    subscribe{model_name}OptionsHaveChanged() {"{"}
        this.{pascal_to_camel(model_name)}Serv.{pascal_to_camel(model_name)}OptionsHaveChanged.subscribe(() => {"{"}
            this.set{model_name}Options();
        {"}"})
    {"}"}

    set{model_name}Options(
        activeOnly: boolean = true
    ) {"{"}
        return new Promise<void>(resolve=>{"{"}
            this.{pascal_to_camel(model_name)}Serv.get{model_name}Options(activeOnly).subscribe({"{"}
                next: (res) => {"{"}
                    this.optionLists["{pascal_to_camel(model_name)}"] = res;
                    resolve();
                    //this.{pascal_to_camel(model_name)}Options = res;
                {"}"},
                error: (err: any) => {"{"}
                    console.log(err);
                    let errorMessage = "An error occurred while getting the {model_name_words} options. Please try refreshing the page.";
                    this.errorInfo = this.errorServ.getErrorMessage(errorMessage, err.message);
                    resolve();
                {"}"}
            {"}"});
        {"}"})
    {"}"}
"""

    return [
        component_option_imports,
        component_option_keys,
        component_option_constructor,
        component_option_subscribe,
        component_option_seed,
        component_option_methods,
    ]
