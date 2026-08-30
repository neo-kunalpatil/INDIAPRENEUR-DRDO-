import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    TIMESCALE_DATABASE_URL: str = "postgres://tsdbadmin:zevphn0e675bs6lf@r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com:39501/tsdb?sslmode=require"
    MAIN_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/main_dashboard_db"
    SIMULATOR_API: str = "http://localhost:4000"
    SIMULATOR_WS: str = "ws://localhost:4000/stream"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
