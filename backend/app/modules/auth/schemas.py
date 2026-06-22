from pydantic import BaseModel, EmailStr, Field


class AuthCredentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AuthUser(BaseModel):
    id: str
    email: EmailStr | None = None
    role: str = "doctor"


class AuthSession(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    user: AuthUser
