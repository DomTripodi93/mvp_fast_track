from pydantic import BaseModel, create_model
from typing import Type


def to_camel(s: str) -> str:
    parts = s.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])


def to_pascal(s: str) -> str:
    return ''.join(word.capitalize() for word in s.split('_'))


def create_case_model(base_model: Type[BaseModel], alias_fn, name_suffix: str) -> Type[BaseModel]:
    class Config(base_model.Config if hasattr(base_model, "Config") else object):
        alias_generator = alias_fn
        allow_population_by_field_name = True

    fields = {
        name: (field.outer_type_, field.default if field.default is not None else ...)
        for name, field in base_model.__fields__.items()
    }

    return create_model(
        f"{base_model.__name__}{name_suffix}",
        __config__=Config,
        **fields
    )


class DualCaseModel(BaseModel):
    def __init__(self, **data):
        # Remap PascalCase keys → snake_case for internal usage
        normalized = {
            self._remap_pascal_to_snake(k): v
            for k, v in data.items()
        }
        super().__init__(**normalized)

        # Build camelCase model for API responses
        CamelModel = create_case_model(type(self), to_camel, "Camel")
        object.__setattr__(self, "camel", CamelModel(**self.dict()))

    @staticmethod
    def _remap_pascal_to_snake(name: str) -> str:
        import re
        # Converts FirstName → first_name
        s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
        return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()

    class Config:
        arbitrary_types_allowed = True





# from pydantic import BaseModel

# def to_camel(string: str) -> str:
#     parts = string.split('_')
#     return parts[0] + ''.join(word.capitalize() for word in parts[1:])


# def to_pascal(s: str) -> str:
#     return ''.join(word.capitalize() for word in s.split('_'))

# class DualCaseModel(DualCaseMixin, BaseModel):

class CamelModel(BaseModel):
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True
        
        # this makes .dict() and .json() use aliases by default
        orm_mode = True  # optional, useful if returning ORM models
        populate_by_name = True  # for Pydantic v2 compatibility (optional)
        json_encoders = {}
        use_enum_values = True

        @staticmethod
        def schema_extra(schema: dict, model) -> None:
            schema["by_alias"] = True

class PascalModel(BaseModel):
    class Config:
        alias_generator = to_pascal
        allow_population_by_field_name = True
        
        # this makes .dict() and .json() use aliases by default
        orm_mode = True  # optional, useful if returning ORM models
        populate_by_name = True  # for Pydantic v2 compatibility (optional)
        json_encoders = {}
        use_enum_values = True

        @staticmethod
        def schema_extra(schema: dict, model) -> None:
            schema["by_alias"] = True