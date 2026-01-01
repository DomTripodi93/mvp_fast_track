from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from controllers.auth_controller import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    allow_anonymous_routes = [
        "/api/v1/auth/login", 
        "/api/v1/auth/register",
        "/openapi.json",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/test",
        "/api/v1/test/testBulkId",
        "/api/v1/test/testConnection",
        "/api/v1/auth/3jwo303049ow0jwo30938hw0w381wla893w8394joq534r345345hm45ewj89"
    ]
    
    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.allow_anonymous_routes:
            return await call_next(request)

        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.split(" ")[1]
        else:
            return JSONResponse(
                status_code=403,
                content={"detail": "Token missing or incorrectly formatted"}
            )


        try:
            payload = verify_token(token)
            request.state.user = payload
        except Exception as e:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token invalid"}
            )

        
        response = await call_next(request)
        return response