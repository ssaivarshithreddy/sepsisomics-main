from fastapi import APIRouter, Depends, HTTPException, status

from app.common.responses import ApiResponse
from app.core.security import CurrentUser, get_current_user
from app.modules.auth.schemas import AuthCredentials, AuthSession, AuthUser
from app.modules.auth.service import AuthService

router = APIRouter()


@router.post("/login", response_model=ApiResponse[AuthSession])
async def login(payload: AuthCredentials) -> ApiResponse[AuthSession]:
    return ApiResponse(data=AuthService().login(payload))


@router.post("/signup", response_model=ApiResponse[AuthSession])
async def signup(payload: AuthCredentials) -> ApiResponse[AuthSession]:
    try:
        return ApiResponse(data=AuthService().signup(payload))
    except HTTPException as e:
        if e.status_code == 200:
            # Email confirmation required - return as warning not error
            raise HTTPException(status_code=status.HTTP_202_ACCEPTED, detail=e.detail)
        raise


@router.get("/me", response_model=ApiResponse[AuthUser])
async def me(user: CurrentUser = Depends(get_current_user)) -> ApiResponse[AuthUser]:
    return ApiResponse(data=AuthUser(id=user.id, email=user.email, role=user.role))
