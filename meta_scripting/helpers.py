import re
import os
# from pathlib import Path

def create_folder_if_not_exists(folder_path):
    # folder_as_path = Path(folder_path)
    # folder_as_path.mkdir(parents=True, exist_ok=True)
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

def create_folders_if_not_exists(folder_paths):
    for folder_path in folder_paths:
        create_folder_if_not_exists(folder_path)


def pascal_to_snake(name: str) -> str:
    # Converts FirstName → first_name
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1).lower()

def pascal_to_spaced(name: str) -> str:
    # Converts FirstName → first_name
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1 \2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s1)


def pascal_to_kabob(name: str) -> str:
    # Converts FirstName → first_name
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1-\2", name)
    return re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s1).lower()


def snake_to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


def pascal_to_camel(s: str) -> str:
    acronym_reduced_string = re.sub(
        r"^([A-Z]+)(?=[A-Z][a-z]|$)", lambda m: m.group(1).lower(), s
    )
    return acronym_reduced_string[0].lower() + acronym_reduced_string[1:]


def snake_to_pascal(s: str) -> str:
    return "".join(word.capitalize() for word in s.split("_"))


def pascal_to_words(s: str) -> str:
    # Add a space before each capital letter (not at start)
    return re.sub(r'(?<!^)([A-Z])', r' \1', s)