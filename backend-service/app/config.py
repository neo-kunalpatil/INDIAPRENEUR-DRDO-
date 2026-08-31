import os
from dotenv import load_dotenv

# Ensure .env variables are loaded into os.environ
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

class Settings:
    def __init__(self):
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))
        self.GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
        self.TIMESCALE_DATABASE_URL: str = os.getenv("TIMESCALE_DATABASE_URL", "postgres://tsdbadmin:zevphn0e675bs6lf@r027jcdwwk.tswdu18qwn.tsdb.cloud.timescale.com:39501/tsdb?sslmode=require")
        self.MAIN_DATABASE_URL: str = os.getenv("MAIN_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/main_dashboard_db")
        self.SIMULATOR_API: str = os.getenv("SIMULATOR_API", "http://localhost:4000")
        self.SIMULATOR_WS: str = os.getenv("SIMULATOR_WS", "ws://localhost:4000/stream")
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
