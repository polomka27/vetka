from sqlalchemy import ForeignKey, String

from ..extensions import db


class Resource(db.Model):
    __tablename__ = "resources"

    id = db.Column(db.Integer, primary_key=True)
    node_id = db.Column(
        db.Integer,
        ForeignKey("roadmap_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(String(255), nullable=False)
    url = db.Column(String(2048), nullable=False)
    resource_type = db.Column(String(50), nullable=False, default="link", server_default="link")
    position = db.Column(db.Integer, nullable=False, default=0, server_default="0")

    node = db.relationship("RoadmapNode", back_populates="resources", lazy="joined")

    def __repr__(self) -> str:
        return f"<Resource id={self.id} node_id={self.node_id} title={self.title!r}>"
