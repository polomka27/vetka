from sqlalchemy import DateTime, func

from ..extensions import db


class BaseModel(db.Model):
    __abstract__ = True

    created_at = db.Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = db.Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
