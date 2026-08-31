import os

class Settings:
    def __init__(self):
        # Allow deployment environments to override URLs via ENV variables
        self.DATABASE_URL: str = os.getenv("DATABASE_URL")
        self.REDIS_URL: str = os.getenv("REDIS_URL")
        
        # Microservice Endpoints - Strict Environment Variable Enforcement
        self.SIMULATOR_API: str = os.getenv("SIMULATOR_API")
        self.SIMULATOR_WS: str = os.getenv("SIMULATOR_WS")
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", 8000))

settings = Settings()
