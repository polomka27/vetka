from sqlalchemy import Boolean, ForeignKey, String, Text

from ..extensions import db
from .base import BaseModel


class Roadmap(BaseModel):
    __tablename__ = "roadmaps"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(String(140), unique=True, nullable=False, index=True)
    title = db.Column(String(255), nullable=False)
    short_description = db.Column(String(500), nullable=False)
    full_description = db.Column(Text, nullable=True)
    category = db.Column(String(100), nullable=False, index=True)
    level = db.Column(String(50), nullable=False, index=True)
    is_published = db.Column(
        Boolean,
        nullable=False,
        default=False,
        server_default=db.false(),
    )
    author_id = db.Column(
        db.Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    author = db.relationship("User", back_populates="roadmaps", lazy="joined")
    nodes = db.relationship(
        "RoadmapNode",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="RoadmapNode.position",
        lazy="select",
    )
    progress_entries = db.relationship(
        "UserNodeProgress",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="select",
    )
    tag_links = db.relationship(
        "RoadmapTagLink",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Roadmap id={self.id} slug={self.slug!r} published={self.is_published}>"
