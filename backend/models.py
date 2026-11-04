
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func

from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    original_prompt = Column(String, nullable=False)
    mode = Column(String, nullable=False)

    score = Column(Integer, nullable=True)
    quality_level = Column(String, nullable=True)

    score_breakdown = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    suggestions = Column(JSON, nullable=True)

    optimized_prompt = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
