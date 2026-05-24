from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text, UniqueConstraint, func

from ..extensions import db


progress_status_enum = Enum(
    "not_started",
    "in_progress",
    "done",
    name="progress_status",
    native_enum=False,
)


class UserNodeProgress(db.Model):
    __tablename__ = "user_node_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "node_id", name="uq_user_node_progress"),
        Index("ix_user_node_progress_user_roadmap", "user_id", "roadmap_id"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    roadmap_id = db.Column(
        db.Integer,
        ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id = db.Column(
        db.Integer,
        ForeignKey("roadmap_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = db.Column(
        progress_status_enum,
        nullable=False,
        default="not_started",
        server_default="not_started",
    )
    started_at = db.Column(DateTime(timezone=True), nullable=True)
    completed_at = db.Column(DateTime(timezone=True), nullable=True)
    note = db.Column(Text, nullable=True)
    updated_at = db.Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = db.relationship("User", back_populates="node_progress", lazy="select")
    roadmap = db.relationship("Roadmap", back_populates="progress_entries", lazy="joined")
    node = db.relationship("RoadmapNode", back_populates="progress_entries", lazy="joined")

    def __repr__(self) -> str:
        return (
            f"<UserNodeProgress id={self.id} user_id={self.user_id} "
            f"node_id={self.node_id} status={self.status!r}>"
        )
