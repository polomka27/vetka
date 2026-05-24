"""add note to user node progress

Revision ID: 2b7d6d8d9a10
Revises: 1ca30a28e0e0
Create Date: 2026-04-07 22:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2b7d6d8d9a10"
down_revision = "1ca30a28e0e0"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("user_node_progress", schema=None) as batch_op:
        batch_op.add_column(sa.Column("note", sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table("user_node_progress", schema=None) as batch_op:
        batch_op.drop_column("note")
