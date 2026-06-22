from app.core.config import settings


class SensitiveDataProtector:
    def __init__(self) -> None:
        self._fernet = None
        if settings.sensitive_data_key:
            from cryptography.fernet import Fernet

            self._fernet = Fernet(settings.sensitive_data_key.encode())

    def encrypt(self, value: str | None) -> str | None:
        if value is None or self._fernet is None:
            return value
        return self._fernet.encrypt(value.encode()).decode()

    def decrypt(self, value: str | None) -> str | None:
        if value is None or self._fernet is None:
            return value
        return self._fernet.decrypt(value.encode()).decode()


protector = SensitiveDataProtector()
