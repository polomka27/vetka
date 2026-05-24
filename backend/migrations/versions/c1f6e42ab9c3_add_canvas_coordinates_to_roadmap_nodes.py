"""add canvas coordinates to roadmap nodes

Revision ID: c1f6e42ab9c3
Revises: 70c4b7b8f2b1
Create Date: 2026-04-08 03:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


# Блок описывает идентификаторы миграции Alembic.
revision = "c1f6e42ab9c3"
down_revision = "70c4b7b8f2b1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Блок добавляет сохраняемые координаты шагов для ручного размещения на карте.
    op.add_column("roadmap_nodes", sa.Column("canvas_x", sa.Float(), nullable=True))
    op.add_column("roadmap_nodes", sa.Column("canvas_y", sa.Float(), nullable=True))


def downgrade() -> None:
    # Блок откатывает координаты шагов при возврате миграции.
    op.drop_column("roadmap_nodes", "canvas_y")
    op.drop_column("roadmap_nodes", "canvas_x")
