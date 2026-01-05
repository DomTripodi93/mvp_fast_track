import os
import hashlib
import secrets
from models.user_auth import UserCreate, UserLogin
from shared.data_access import DataAccess
import jwt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, timezone

from shared.request_encryption import RequestEncryption

# Secret key and algorithm for JWT
SECRET_KEY = "oin(@)67)936oqiu#$^*@)^*49#/$^()q3468678293023qwye#/$20otnyqwiot2348nqwejr47(#<$ioqwmeous)"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 2880 # 48hrs * 60min


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

router = APIRouter()

data_access = DataAccess()


hash_secret_pw = "jieoruoq@#)$<!job230a@#r1)@aslwler#(54<$oixpvcias30@@$ojwouuzj#$@d?"
hash_secret_oauth = "asljwlerjiou)@#(54<$oweoruoq@#)$<!@#r1230as30@@$oijobxpvciauzj#$@d?"

def get_password_hash(password, salt = ""):
    if (salt == ""):
        salt = os.urandom(16)  # Generate a random salt
        
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        (hash_secret_pw + salt).encode('utf-8'), 
        1000000, 
        32 
    )
    return key, salt

def get_oauth_hash(password, salt = ""):
    if (salt == ""):
        salt = os.urandom(16)  # Generate a random salt
        
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        (hash_secret_oauth + salt).encode('utf-8'), 
        1000000, 
        32 
    )
    return key, salt

def verify_password(input_pw, stored_hash, stored_salt):
    input_hash, _ = get_password_hash(input_pw, stored_salt)
     
    return secrets.compare_digest(input_hash, stored_hash)

def authenticate_user(username: str, password: str):
    sql = "EXEC dbo.spLoginConfirmation_Get @Email=:email"
    # sql = "EXEC dbo.spUserForAuth_Get @UserName=:username"
    user = data_access.load_query_single_with_params(sql, {"email": username})
    
    if not user or not verify_password(password, user["passwordHash"], user["passwordSalt"]):
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return payload
    except jwt.ExpiredSignatureError:
        # print("hit1")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.PyJWTError:
        # print("hit2")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")



@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_for_register: UserCreate):
    encryption_helper = RequestEncryption()
    decrypted_pw = encryption_helper.decrypt(user_for_register.password)
    decrypted_pw_confirm = encryption_helper.decrypt(user_for_register.password_confirm)
    # if username in fake_users_db:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    
    # if (user_for_register.password == user_for_register.password_confirm):
        # password_hash, password_salt = get_password_hash(user_for_register.password)
    if (decrypted_pw == decrypted_pw_confirm):
        password_hash, password_salt = get_password_hash(decrypted_pw)
        # fake_users_db[username] = {"username": username, "password": hashed_password}
        sql = """EXEC dbo.spRegistration_Upsert @Username = :username
            , @PasswordHash = :password_hash
            , @PasswordSalt = :password_salt"""
        auth_params = {
            "password_hash": password_hash,
            "password_salt": password_salt,
            "username": user_for_register.username
        }
        data_access.execute_query_with_params(sql, auth_params)
            
        return {"message": "User registered successfully"}
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Password does not match Password Confirm!"}
    )


@router.post("/login", response_model=dict)
# async def login(form_data: OAuth2PasswordRequestForm = Depends()):
async def login(user_for_login: UserLogin):
    encryption_helper = RequestEncryption()
    decrypted_pw = encryption_helper.decrypt(user_for_login.password)
    
    # user = authenticate_user(user_for_login.username, user_for_login.password)
    user = authenticate_user(user_for_login.email, decrypted_pw)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    
    # Create JWT token
    access_token = create_access_token(data={"email": user_for_login.email, "username": user["username"], "account_id": user["accountId"]})

    return {"token": access_token}



@router.get("/slwe1286lkjow54ojjiehyrpqlx83hoq4ojdj6fgtyvjczoseruwoijd", response_model=dict)
async def get_pub_key():
    encryption_helper = RequestEncryption()
    return {"encryptionKey": encryption_helper.get_pub_key_base64()}
    

# async def get_current_user(token: str = Depends(oauth2_scheme)):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
#         user = fake_users_db.get(username)
#         if user is None:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
#         return user
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
#     except jwt.PyJWTError:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
# @router.get("/profile")
# async def read_users_me(current_user: dict = Depends(get_current_user)):
#     return {"username": current_user["username"]}
