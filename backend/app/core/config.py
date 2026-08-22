import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/globetrotter"
    
    # Security / JWT
    SECRET_KEY: str = "supersecretdevkeyreplaceinprod12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Third-Party API Keys
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    
    # Uploads
    UPLOAD_DIR: str = "./uploads"
    
    # CORS Origins
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173"
    
    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return v

    # URLs
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

def get_settings() -> Settings:
    return settings
