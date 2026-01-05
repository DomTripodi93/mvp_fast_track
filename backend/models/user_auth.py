from models.dual_case_model import CamelModel as BaseModel

# User schema for registration
class UserCreate(BaseModel):
    email: str
    password: str
    password_confirm: str

# User schema for login
class UserLogin(BaseModel):
    email: str
    password: str

# User schema for login
class AuthObject(BaseModel):
    password_hash: str
    password_salt: str

