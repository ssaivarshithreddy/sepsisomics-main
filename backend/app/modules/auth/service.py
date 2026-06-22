from fastapi import HTTPException, status

from app.core.supabase import get_supabase_public
from app.modules.auth.schemas import AuthCredentials, AuthSession, AuthUser


class AuthService:
    def __init__(self) -> None:
        self.client = get_supabase_public()

    def login(self, payload: AuthCredentials) -> AuthSession:
        try:
            response = self.client.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
            if not response.session or not response.user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
            return self._session_response(response)
        except Exception as e:
            error_msg = str(e).lower()
            if "invalid login credentials" in error_msg or "email not confirmed" in error_msg:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
            if "user not found" in error_msg:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not registered")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

    def signup(self, payload: AuthCredentials) -> AuthSession:
        try:
            response = self.client.auth.sign_up({"email": payload.email, "password": payload.password})
            # Handle both confirmed and unconfirmed signup flows
            if response.user:
                if response.session:
                    # Auto-confirmed (development or verified email)
                    return self._session_response(response)
                else:
                    # Email confirmation required
                    raise HTTPException(
                        status_code=status.HTTP_200_OK,
                        detail=f"Signup successful! Please check your email ({payload.email}) to confirm your account.",
                    )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account creation failed")
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e).lower()
            if "user already exists" in error_msg or "already registered" in error_msg:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            if "password" in error_msg:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password does not meet requirements")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup failed")

    @staticmethod
    def _session_response(response) -> AuthSession:
        user_metadata = response.user.user_metadata or {}
        app_metadata = response.user.app_metadata or {}
        role = app_metadata.get("role") or user_metadata.get("role") or "doctor"
        return AuthSession(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user=AuthUser(id=response.user.id, email=response.user.email, role=role),
        )
