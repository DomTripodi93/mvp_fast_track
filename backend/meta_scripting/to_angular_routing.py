import re
from meta_scripting.helpers import (
    pascal_to_words,
    pascal_to_kabob,
)


def table_to_angular_routing(
    model_name: str = "AutoModel",
    file_root_model: str = "AutoModel",
) -> str:

    component_routing_start = f"""import {"{"} {model_name}Component {"}"} from './{pascal_to_kabob(file_root_model)}/{pascal_to_kabob(model_name)}/{pascal_to_kabob(model_name)}-component.component';
"""

    component_routing_end = f"""        {"{"}path: "{pascal_to_kabob(model_name)}", component: {model_name}Component, pathMatch: "full"{"}"},
"""

    component_routing_menu = f"""                {"{"}
                    itemText: "{pascal_to_words(model_name)}",
                    itemValue: "{pascal_to_kabob(model_name)}",
                    admin: false
                {"}"},
"""

    return [
        component_routing_start,
        component_routing_end,
        component_routing_menu,
    ]
